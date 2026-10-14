import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { Role } from '../roles/role.entity';
import { User } from '../users/user.entity';
import { ALL_PERMISSIONS, BASE_ROLES, PERMISSIONS } from '../roles/permissions';

/**
 * Crea los roles base (RF02) y el primer administrador. Es idempotente:
 * se puede ejecutar varias veces sin duplicar datos.
 */
const baseRoles = [
  {
    code: BASE_ROLES.ADMIN,
    name: 'Administrador',
    description: 'Gestiona usuarios, roles, catálogos y parametrización de especies.',
    permissions: ALL_PERMISSIONS,
  },
  {
    code: BASE_ROLES.EVALUADOR,
    name: 'Evaluador',
    description: 'Registra fincas y diligencia evaluaciones de bienestar animal.',
    permissions: [
      PERMISSIONS.FINCAS_VER,
      PERMISSIONS.FINCAS_GESTIONAR,
      PERMISSIONS.EVALUACIONES_VER,
      PERMISSIONS.EVALUACIONES_DILIGENCIAR,
      PERMISSIONS.REPORTES_VER,
    ],
  },
  {
    code: BASE_ROLES.CONSULTOR,
    name: 'Consultor externo',
    description: 'Consulta fincas, evaluaciones y reportes sin modificarlos.',
    permissions: [PERMISSIONS.FINCAS_VER, PERMISSIONS.EVALUACIONES_VER, PERMISSIONS.REPORTES_VER],
  },
];

async function seed() {
  await dataSource.initialize();
  const roles = dataSource.getRepository(Role);
  const users = dataSource.getRepository(User);

  for (const base of baseRoles) {
    const existing = await roles.findOne({ where: { code: base.code } });
    if (existing) {
      // Los permisos nuevos del catálogo se agregan al administrador.
      if (base.code === BASE_ROLES.ADMIN) {
        existing.permissions = Array.from(new Set([...existing.permissions, ...ALL_PERMISSIONS]));
        await roles.save(existing);
      }
      continue;
    }
    await roles.save(roles.create({ ...base, isSystem: true }));
    console.log(`Rol creado: ${base.name}`);
  }

  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (email && password && !(await users.exist({ where: { email } }))) {
    const admin = await roles.findOneOrFail({ where: { code: BASE_ROLES.ADMIN } });
    await users.save(
      users.create({
        firstName: 'Administrador',
        lastName: 'del sistema',
        email,
        passwordHash: await bcrypt.hash(password, 12),
        roleId: admin.id,
      }),
    );
    console.log(`Administrador inicial creado: ${email}. Cambie la contraseña al primer ingreso.`);
  }

  await dataSource.destroy();
}

seed().catch((error) => {
  console.error(error);
  process.exit(1);
});
