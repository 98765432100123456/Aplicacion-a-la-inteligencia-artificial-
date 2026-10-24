import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { MailService } from '../src/mail/mail.service';
import { ALL_PERMISSIONS, PERMISSIONS } from '../src/roles/constants/permissions';
import { Role } from '../src/roles/entities/role.entity';
import { User } from '../src/users/entities/user.entity';
import { setupApp } from '../src/setup-app';

const ADMIN = { email: 'admin@prueba.co', password: 'Administra2026' };
const CONSULTOR = { email: 'consultor@prueba.co', password: 'Consulta2026x' };

function tokenFromMail(mail: MailService): string {
  const match = mail.lastMessage?.text.match(/token=([^\s]+)/);
  if (!match) throw new Error('No se encontró el enlace en el correo');
  return decodeURIComponent(match[1]);
}

describe('Seguridad: autenticación, usuarios y roles (e2e)', () => {
  let app: INestApplication;
  let mail: MailService;
  let adminToken: string;
  let roles: Record<string, Role>;

  const http = () => request(app.getHttpServer());
  const login = (email: string, password: string) => http().post('/api/auth/login').send({ email, password });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();
    mail = app.get(MailService);

    const ds = app.get(DataSource);
    await ds.dropDatabase();
    await ds.runMigrations();

    const roleRepo = ds.getRepository(Role);
    roles = {
      ADMIN: await roleRepo.save({ code: 'ADMIN', name: 'Administrador', permissions: ALL_PERMISSIONS, isSystem: true }),
      EVALUADOR: await roleRepo.save({
        code: 'EVALUADOR',
        name: 'Evaluador',
        permissions: [PERMISSIONS.EVALUACIONES_DILIGENCIAR],
        isSystem: true,
      }),
      CONSULTOR: await roleRepo.save({
        code: 'CONSULTOR',
        name: 'Consultor externo',
        permissions: [PERMISSIONS.REPORTES_VER],
        isSystem: true,
      }),
    };
    const userRepo = ds.getRepository(User);
    await userRepo.save({
      firstName: 'Ana',
      lastName: 'Admin',
      email: ADMIN.email,
      passwordHash: await bcrypt.hash(ADMIN.password, 4),
      roleId: roles.ADMIN.id,
    });
    await userRepo.save({
      firstName: 'Carlos',
      lastName: 'Consultor',
      email: CONSULTOR.email,
      passwordHash: await bcrypt.hash(CONSULTOR.password, 4),
      roleId: roles.CONSULTOR.id,
    });
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Inicio de sesión', () => {
    it('entrega token y permisos con credenciales válidas (correo sin importar mayúsculas)', async () => {
      const res = await login('ADMIN@prueba.co', ADMIN.password).expect(200);
      expect(res.body.accessToken).toEqual(expect.any(String));
      expect(res.body.user.role.code).toBe('ADMIN');
      expect(res.body.user.permissions).toContain(PERMISSIONS.USUARIOS_GESTIONAR);
      adminToken = res.body.accessToken;
    });

    it('rechaza credenciales inválidas con el mismo mensaje exista o no el correo', async () => {
      const a = await login(ADMIN.email, 'incorrecta1').expect(401);
      const b = await login('nadie@prueba.co', 'incorrecta1').expect(401);
      expect(a.body.message).toBe(b.body.message);
    });

    it('valida el formato del cuerpo', async () => {
      const res = await http().post('/api/auth/login').send({ email: 'no-es-correo' }).expect(400);
      expect(res.body.message).toEqual(expect.arrayContaining(['Escriba un correo válido.']));
    });

    it('protege las rutas privadas', async () => {
      await http().get('/api/auth/me').expect(401);
      const res = await http().get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`).expect(200);
      expect(res.body.email).toBe(ADMIN.email);
    });

    it('bloquea la cuenta tras 5 intentos fallidos', async () => {
      for (let i = 0; i < 5; i++) await login(CONSULTOR.email, 'mala-clave-1').expect(401);
      const res = await login(CONSULTOR.email, CONSULTOR.password).expect(401);
      expect(res.body.message).toMatch(/bloqueada/);
      await app.get(DataSource).getRepository(User).update({ email: CONSULTOR.email }, { lockedUntil: null });
    });
  });

  describe('Control de acceso por rol', () => {
    it('niega la gestión de usuarios a un consultor', async () => {
      const { body } = await login(CONSULTOR.email, CONSULTOR.password).expect(200);
      await http().get('/api/users').set('Authorization', `Bearer ${body.accessToken}`).expect(403);
      await http().get('/api/roles').set('Authorization', `Bearer ${body.accessToken}`).expect(403);
    });
  });

  describe('Recuperación de contraseña', () => {
    it('responde igual para correos registrados y no registrados', async () => {
      mail.lastMessage = null;
      const unknown = await http().post('/api/auth/forgot-password').send({ email: 'x@prueba.co' }).expect(200);
      expect(mail.lastMessage).toBeNull();
      const known = await http().post('/api/auth/forgot-password').send({ email: CONSULTOR.email }).expect(200);
      expect(known.body.message).toBe(unknown.body.message);
      expect(mail.lastMessage!.to).toBe(CONSULTOR.email);
    });

    it('permite definir una nueva contraseña con el enlace una sola vez', async () => {
      const token = tokenFromMail(mail);
      const check = await http().get('/api/auth/reset-password/validate').query({ token }).expect(200);
      expect(check.body).toEqual({ valid: true, email: expect.stringContaining('@prueba.co') });

      await http().post('/api/auth/reset-password').send({ token, password: 'corta' }).expect(400);
      await http().post('/api/auth/reset-password').send({ token, password: 'NuevaClave2026' }).expect(200);
      await http().post('/api/auth/reset-password').send({ token, password: 'OtraClave2026' }).expect(400);

      await login(CONSULTOR.email, CONSULTOR.password).expect(401);
      await login(CONSULTOR.email, 'NuevaClave2026').expect(200);
      CONSULTOR.password = 'NuevaClave2026';
    });

    it('cambia la contraseña de la sesión actual e invalida el token anterior', async () => {
      const first = await login(CONSULTOR.email, CONSULTOR.password).expect(200);
      // iat se mide en segundos: se espera para que el cambio quede después del token.
      await new Promise((r) => setTimeout(r, 1100));
      const res = await http()
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${first.body.accessToken}`)
        .send({ currentPassword: CONSULTOR.password, newPassword: 'Cambiada2026' })
        .expect(200);
      await new Promise((r) => setTimeout(r, 1100));
      await http().get('/api/auth/me').set('Authorization', `Bearer ${first.body.accessToken}`).expect(401);
      CONSULTOR.password = 'Cambiada2026';
      expect(res.body.accessToken).toEqual(expect.any(String));
      await login(CONSULTOR.email, CONSULTOR.password).expect(200);
    });
  });

  describe('Gestión de usuarios', () => {
    let userId: string;

    it('crea un usuario y le envía el enlace para definir su contraseña', async () => {
      const res = await http()
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Eva', lastName: 'Luna', email: 'Eva@Prueba.co', roleId: roles.EVALUADOR.id })
        .expect(201);
      userId = res.body.id;
      expect(res.body).toMatchObject({ email: 'eva@prueba.co', active: true, role: { code: 'EVALUADOR' } });
      expect(res.body.passwordHash).toBeUndefined();
      expect(mail.lastMessage!.to).toBe('eva@prueba.co');

      const token = tokenFromMail(mail);
      await http().post('/api/auth/reset-password').send({ token, password: 'EvaLuna2026' }).expect(200);
      await login('eva@prueba.co', 'EvaLuna2026').expect(200);
    });

    it('no permite correos duplicados', async () => {
      await http()
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ firstName: 'Otra', lastName: 'Eva', email: 'eva@prueba.co', roleId: roles.EVALUADOR.id })
        .expect(409);
    });

    it('lista con búsqueda, filtros y paginación', async () => {
      const res = await http()
        .get('/api/users')
        .query({ search: 'eva luna', active: 'true', page: 1, pageSize: 5 })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      expect(res.body.total).toBe(1);
      expect(res.body.items[0].email).toBe('eva@prueba.co');
    });

    it('edita datos y rol; el cambio de rol cierra la sesión del usuario', async () => {
      const session = await login('eva@prueba.co', 'EvaLuna2026').expect(200);
      await new Promise((r) => setTimeout(r, 1100));
      const res = await http()
        .patch(`/api/users/${userId}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ phone: '300 123 4567', roleId: roles.CONSULTOR.id })
        .expect(200);
      expect(res.body).toMatchObject({ phone: '300 123 4567', role: { code: 'CONSULTOR' } });
      await new Promise((r) => setTimeout(r, 1100));
      await http().get('/api/auth/me').set('Authorization', `Bearer ${session.body.accessToken}`).expect(401);
    });

    it('inactiva y reactiva; el usuario inactivo no puede ingresar', async () => {
      await http()
        .patch(`/api/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false })
        .expect(200);
      const res = await login('eva@prueba.co', 'EvaLuna2026').expect(401);
      expect(res.body.message).toMatch(/inactivo/);
      await http()
        .patch(`/api/users/${userId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: true })
        .expect(200);
      await login('eva@prueba.co', 'EvaLuna2026').expect(200);
    });

    it('impide que el administrador se inactive a sí mismo', async () => {
      const me = await http().get('/api/auth/me').set('Authorization', `Bearer ${adminToken}`);
      const res = await http()
        .patch(`/api/users/${me.body.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false })
        .expect(400);
      expect(res.body.message).toMatch(/propio usuario/);
    });
  });

  describe('Gestión de roles', () => {
    let roleId: string;

    it('crea un rol con permisos del catálogo', async () => {
      const res = await http()
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'docente', name: 'Docente', permissions: [PERMISSIONS.REPORTES_VER] })
        .expect(201);
      roleId = res.body.id;
      expect(res.body).toMatchObject({ code: 'DOCENTE', isSystem: false, userCount: 0 });
    });

    it('rechaza permisos que no existen y códigos repetidos', async () => {
      await http()
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'X1', name: 'X', permissions: ['borrar.todo'] })
        .expect(400);
      await http()
        .post('/api/roles')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ code: 'DOCENTE', name: 'Otro', permissions: [] })
        .expect(409);
    });

    it('edita permisos y aplica de inmediato a los usuarios del rol', async () => {
      await http()
        .patch(`/api/roles/${roles.CONSULTOR.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: [PERMISSIONS.REPORTES_VER, PERMISSIONS.USUARIOS_VER] })
        .expect(200);
      const { body } = await login(CONSULTOR.email, CONSULTOR.password).expect(200);
      await http().get('/api/users').set('Authorization', `Bearer ${body.accessToken}`).expect(200);
    });

    it('protege el rol Administrador y los roles base', async () => {
      await http()
        .patch(`/api/roles/${roles.ADMIN.id}`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ permissions: [PERMISSIONS.REPORTES_VER] })
        .expect(400);
      await http()
        .patch(`/api/roles/${roles.EVALUADOR.id}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false })
        .expect(400);
    });

    it('inactiva un rol sin usuarios activos', async () => {
      const res = await http()
        .patch(`/api/roles/${roleId}/status`)
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ active: false })
        .expect(200);
      expect(res.body.active).toBe(false);
    });

    it('registra auditoría de las acciones críticas', async () => {
      const rows: { action: string }[] = await app.get(DataSource).query('SELECT action FROM audit_logs');
      const actions = rows.map((r) => r.action);
      expect(actions).toEqual(
        expect.arrayContaining(['auth.login', 'auth.password_reset', 'user.created', 'user.deactivated', 'role.created']),
      );
    });
  });
});
