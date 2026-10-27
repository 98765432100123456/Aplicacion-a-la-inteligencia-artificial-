import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as bcrypt from 'bcryptjs';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { AppModule } from '../src/app.module';
import { LISTA_BOVINOS } from '../src/compartido/lista-chequeo';
import { MailService } from '../src/mail/mail.service';
import { Species } from '../src/farms/entities/species.entity';
import { PERMISSIONS } from '../src/roles/constants/permissions';
import { Role } from '../src/roles/entities/role.entity';
import { setupApp } from '../src/setup-app';
import { User } from '../src/users/entities/user.entity';

const CLAVE = 'Prueba.2026x';

describe('Predios, evaluaciones e informes (e2e)', () => {
  let app: INestApplication;
  let bovino: Species;
  const tokens: Record<string, string> = {};
  const http = () => request(app.getHttpServer());
  const como = (quien: string) => ({ Authorization: `Bearer ${tokens[quien]}` });

  const predio = (nombre: string, correo: string) => ({
    name: nombre,
    ownerName: 'Pedro Pérez',
    ownerPhone: '3104567890',
    ownerEmail: correo,
    department: 'Cundinamarca',
    municipality: 'Ubaté',
    species: [{ speciesId: bovino.id, calves: 18, young: 34, adults: 68 }],
  });

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    setupApp(app);
    await app.init();

    const ds = app.get(DataSource);
    await ds.dropDatabase();
    await ds.runMigrations();
    bovino = await ds.getRepository(Species).save({ code: 'BOVINO', name: 'Bovinos' });

    const roles = ds.getRepository(Role);
    const evaluador = await roles.save({
      code: 'EVALUADOR',
      name: 'Evaluador',
      isSystem: true,
      permissions: [PERMISSIONS.FINCAS_VER, PERMISSIONS.FINCAS_GESTIONAR, PERMISSIONS.EVALUACIONES_VER, PERMISSIONS.EVALUACIONES_DILIGENCIAR],
    });
    const propietario = await roles.save({ code: 'PROPIETARIO', name: 'Propietario del predio', isSystem: true, permissions: [PERMISSIONS.PREDIOS_PROPIOS] });

    const users = ds.getRepository(User);
    const hash = await bcrypt.hash(CLAVE, 4);
    for (const [quien, email, roleId] of [
      ['evaluador', 'eva@prueba.co', evaluador.id],
      ['dueno', 'dueno@prueba.co', propietario.id],
      ['otro', 'otro@prueba.co', propietario.id],
    ] as const) {
      await users.save({ firstName: quien, lastName: 'Prueba', email, passwordHash: hash, roleId });
      const res = await http().post('/api/auth/login').send({ email, password: CLAVE }).expect(200);
      tokens[quien] = res.body.accessToken;
    }
  });

  afterAll(async () => {
    await app.close();
  });

  let predioId: string;
  let ajenoId: string;
  let evaluacionId: string;

  it('registra un predio y calcula tipo de productor y muestra según la norma', async () => {
    const res = await http().post('/api/farms').set(como('evaluador')).send(predio('La Esperanza', 'dueno@prueba.co')).expect(201);
    predioId = res.body.id;
    expect(res.body.totalAnimals).toBe(120);
    expect(res.body.species[0]).toMatchObject({ producerType: 'MEDIANO', sampleSize: 30 });
    expect(res.body.owner.hasAccount).toBe(true);

    ajenoId = (await http().post('/api/farms').set(como('evaluador')).send(predio('El Recreo', 'nadie@prueba.co')).expect(201)).body.id;
  });

  it('exige al menos una especie con animales', async () => {
    const res = await http().post('/api/farms').set(como('evaluador')).send({ ...predio('Sin animales', 'x@prueba.co'), species: [] }).expect(400);
    expect(res.body.message).toContain('Registre al menos una especie con su inventario.');
  });

  it('el propietario solo ve sus predios y no puede crearlos', async () => {
    const lista = await http().get('/api/farms').set(como('dueno')).expect(200);
    expect(lista.body.map((f: { name: string }) => f.name)).toEqual(['La Esperanza']);
    await http().get(`/api/farms/${ajenoId}`).set(como('dueno')).expect(404);
    await http().get(`/api/farms/${predioId}`).set(como('otro')).expect(404);
    await http().post('/api/farms').set(como('dueno')).send(predio('Mío', 'dueno@prueba.co')).expect(403);
  });

  it('inicia la evaluación con la lista de la especie y la retoma si ya está en curso', async () => {
    const res = await http().post(`/api/farms/${predioId}/evaluations`).set(como('evaluador')).send({ speciesId: bovino.id }).expect(201);
    evaluacionId = res.body.id;
    expect(res.body.status).toBe('BORRADOR');
    expect(res.body.checklist).toHaveLength(LISTA_BOVINOS.length);
    expect(res.body.sampleByGroup).toEqual([5, 8, 17]);

    const otra = await http().post(`/api/farms/${predioId}/evaluations`).set(como('evaluador')).send({ speciesId: bovino.id }).expect(201);
    expect(otra.body.id).toBe(evaluacionId);
  });

  it('valida respuestas, guarda parcialmente y no finaliza con indicadores pendientes', async () => {
    const si_no = LISTA_BOVINOS.find((i) => i.respuesta === 'SI_NO')!;
    await http().put(`/api/evaluations/${evaluacionId}`).set(como('evaluador')).send({ answers: [{ indicatorCode: si_no.codigo, answer: 'PARCIAL' }] }).expect(400);

    const parcial = LISTA_BOVINOS.slice(0, 5).map((i) => ({ indicatorCode: i.codigo, answer: 'CUMPLE' }));
    const res = await http().put(`/api/evaluations/${evaluacionId}`).set(como('evaluador')).send({ answers: parcial }).expect(200);
    expect(res.body.answers).toHaveLength(5);

    const fin = await http().post(`/api/evaluations/${evaluacionId}/finalize`).set(como('evaluador')).expect(400);
    expect(fin.body.message).toMatch(/^Faltan \d+ indicadores por responder/);
  });

  it('el propietario no ve evaluaciones en borrador', async () => {
    const res = await http().get(`/api/farms/${predioId}/evaluations`).set(como('dueno')).expect(200);
    expect(res.body).toHaveLength(0);
    await http().get(`/api/evaluations/${evaluacionId}`).set(como('dueno')).expect(404);
  });

  it('finaliza con puntaje ponderado, nivel, recomendaciones por reglas y dos informes', async () => {
    // Todo cumple excepto N1 (crítico, peso 3 de 11 en alimento y agua): alimento 3,64; total 4,73.
    const answers = LISTA_BOVINOS.map((i) => ({
      indicatorCode: i.codigo,
      answer: i.codigo === 'N1' ? 'NO_CUMPLE' : 'CUMPLE',
      observation: i.codigo === 'N1' ? '6 de 30 animales flacos' : null,
    }));
    await http().put(`/api/evaluations/${evaluacionId}`).set(como('evaluador')).send({ answers }).expect(200);
    const res = await http().post(`/api/evaluations/${evaluacionId}/finalize`).set(como('evaluador')).expect(200);

    expect(res.body).toMatchObject({ status: 'FINALIZADA', score: 4.73, level: 'EXCELENTE' });
    expect(res.body.results.libertades.find((l: { codigo: string }) => l.codigo === 'NUTRICION')).toMatchObject({ puntaje: 3.64, nivel: 'MEDIO' });
    expect(res.body.results.hallazgos).toEqual([expect.objectContaining({ codigo: 'N1', critico: true, observacion: '6 de 30 animales flacos' })]);
    expect(res.body.recommendation).toMatchObject({ origen: 'REGLAS', recomendaciones: [expect.objectContaining({ prioridad: 'ALTA' })] });
    expect(res.body.reports.map((r: { kind: string }) => r.kind).sort()).toEqual(['PROPIETARIO', 'TECNICO']);

    await http().put(`/api/evaluations/${evaluacionId}`).set(como('evaluador')).send({ generalObservation: 'tarde' }).expect(409);
  });

  it('el propietario consulta el historial y descarga su informe', async () => {
    const hist = await http().get(`/api/farms/${predioId}/evaluations`).set(como('dueno')).expect(200);
    expect(hist.body).toHaveLength(1);
    expect(hist.body[0].recommendation.resumen).toContain('nivel excelente');

    const pdf = await http().get(`/api/evaluations/${evaluacionId}/reports/propietario`).set(como('dueno')).buffer(true).expect(200);
    expect(pdf.headers['content-type']).toBe('application/pdf');
    expect(pdf.headers['content-disposition']).toMatch(/^attachment; filename="recomendaciones-propietario-/);
    expect(pdf.body.subarray(0, 5).toString()).toBe('%PDF-');

    await http().get(`/api/evaluations/${evaluacionId}/reports/tecnico`).set(como('otro')).expect(404);
    await http().get(`/api/evaluations/${evaluacionId}/reports/otro`).set(como('dueno')).expect(400);
  });

  it('un propietario se registra, confirma su correo y ve el predio registrado con ese correo', async () => {
    await http().post('/api/farms').set(como('evaluador')).send(predio('Villa Nueva', 'nuevo@prueba.co')).expect(201);
    const mensaje = 'Si el correo no tenía cuenta, enviamos un enlace para crear su contraseña. Revise también la carpeta de spam.';
    const res = await http().post('/api/auth/register').send({ firstName: 'Nora', lastName: 'Nueva', email: 'Nuevo@Prueba.co' }).expect(200);
    expect(res.body.message).toBe(mensaje);

    const enlace = app.get(MailService).lastMessage!.text.match(/token=([^\s]+)/)![1];
    await http().post('/api/auth/reset-password').send({ token: decodeURIComponent(enlace), password: CLAVE }).expect(200);
    const login = await http().post('/api/auth/login').send({ email: 'nuevo@prueba.co', password: CLAVE }).expect(200);
    expect(login.body.user.role.code).toBe('PROPIETARIO');
    const lista = await http().get('/api/farms').set({ Authorization: `Bearer ${login.body.accessToken}` }).expect(200);
    expect(lista.body.map((f: { name: string }) => f.name)).toEqual(['Villa Nueva']);

    // Repetir el registro no revela que la cuenta existe ni envía otro correo.
    const antes = app.get(MailService).lastMessage;
    expect((await http().post('/api/auth/register').send({ firstName: 'Otra', lastName: 'Vez', email: 'nuevo@prueba.co' }).expect(200)).body.message).toBe(mensaje);
    expect(app.get(MailService).lastMessage).toBe(antes);
  });

  it('el ingreso con proveedores externos queda deshabilitado sin proyecto de Firebase', async () => {
    expect((await http().get('/api/auth/config').expect(200)).body).toEqual({ registration: true, firebase: null });
    await http().post('/api/auth/firebase').send({ idToken: 'x'.repeat(40) }).expect(404);
  });
});
