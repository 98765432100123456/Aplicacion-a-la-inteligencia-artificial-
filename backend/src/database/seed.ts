import 'dotenv/config';
import * as bcrypt from 'bcryptjs';
import dataSource from './data-source';
import { Role } from '../roles/entities/role.entity';
import { User } from '../users/entities/user.entity';
import { Species } from '../farms/entities/species.entity';
import { ALL_PERMISSIONS, BASE_ROLES, PERMISSIONS } from '../roles/constants/permissions';

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
  {
    code: BASE_ROLES.PROPIETARIO,
    name: 'Propietario del predio',
    description: 'Consulta la información de sus predios, los resultados de las evaluaciones y las recomendaciones.',
    permissions: [PERMISSIONS.PREDIOS_PROPIOS],
  },
];

/** Especies con lista de chequeo disponible (compartido/lista-chequeo.ts). */
const baseSpecies = [
  { code: 'BOVINO', name: 'Bovinos' },
  { code: 'BUFALINO', name: 'Búfalos' },
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

  const species = dataSource.getRepository(Species);
  for (const base of baseSpecies) {
    if (await species.exist({ where: { code: base.code } })) continue;
    await species.save(species.create(base));
    console.log(`Especie creada: ${base.name}`);
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
