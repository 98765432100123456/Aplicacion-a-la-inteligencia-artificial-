import { SetMetadata } from '@nestjs/common';
import { Permission } from '../../roles/permissions';

export const PERMISSIONS_KEY = 'permissions';
/** Exige al menos uno de los permisos indicados. */
export const RequirePermissions = (...permissions: Permission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
