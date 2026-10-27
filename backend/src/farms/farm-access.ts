import { ForbiddenException } from '@nestjs/common';
import { SelectQueryBuilder } from 'typeorm';
import { AuthUser } from '../common/interfaces/auth-user';
import { PERMISSIONS } from '../roles/constants/permissions';

/**
 * Control de acceso a predios (RNF07). Quien tiene fincas.ver o fincas.gestionar
 * ve todos; quien solo tiene predios.propios ve los predios vinculados a su usuario
 * o registrados con su correo.
 */
export function seesAllFarms(user: AuthUser): boolean {
  return user.permissions.includes(PERMISSIONS.FINCAS_VER) || user.permissions.includes(PERMISSIONS.FINCAS_GESTIONAR);
}

export function limitToUserFarms<T extends object>(qb: SelectQueryBuilder<T>, alias: string, user: AuthUser): SelectQueryBuilder<T> {
  if (seesAllFarms(user)) return qb;
  if (!user.permissions.includes(PERMISSIONS.PREDIOS_PROPIOS)) {
    throw new ForbiddenException('Su rol no tiene permiso para consultar predios.');
  }
  return qb.andWhere(`(${alias}.owner_user_id = :accessUserId OR ${alias}.owner_email = :accessEmail)`, {
    accessUserId: user.id,
    accessEmail: user.email,
  });
}
