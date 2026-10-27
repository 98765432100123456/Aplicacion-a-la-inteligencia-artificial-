import { Routes } from '@angular/router';
import { authGuard, guestGuard, permissionGuard, unsavedChangesGuard } from './core/guards/guards';
import { P } from './core/models/models';

export const routes: Routes = [
  {
    path: 'ingresar',
    canActivate: [guestGuard],
    title: 'Ingresar | ICA Bienestar Animal',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.Login),
  },
  {
    path: 'recuperar-contrasena',
    canActivate: [guestGuard],
    title: 'Recuperar contraseña | ICA Bienestar Animal',
    loadComponent: () => import('./features/auth/forgot-password/forgot-password').then((m) => m.ForgotPassword),
  },
  {
    // Sin guestGuard: el enlace del correo debe funcionar aunque haya otra sesión abierta.
    path: 'restablecer-contrasena',
    title: 'Crear contraseña | ICA Bienestar Animal',
    loadComponent: () => import('./features/auth/reset-password/reset-password').then((m) => m.ResetPassword),
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./layout/shell/shell').then((m) => m.Shell),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'inicio' },
      {
        path: 'inicio',
        title: 'Inicio | ICA Bienestar Animal',
        loadComponent: () => import('./features/home/home/home').then((m) => m.Home),
      },
      {
        path: 'predios',
        title: 'Predios | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.FINCAS_VER, P.FINCAS_GESTIONAR, P.PREDIOS_PROPIOS] },
        loadComponent: () => import('./features/farms/farms-page/farms-page').then((m) => m.FarmsPage),
      },
      {
        path: 'predios/nuevo',
        title: 'Nuevo predio | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.FINCAS_GESTIONAR] },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/farms/farm-create/farm-create').then((m) => m.FarmCreate),
      },
      {
        path: 'predios/:id',
        title: 'Predio | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.FINCAS_VER, P.FINCAS_GESTIONAR, P.PREDIOS_PROPIOS] },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/farms/farm-detail/farm-detail').then((m) => m.FarmDetail),
      },
      {
        path: 'evaluaciones/:id',
        title: 'Evaluación | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.EVALUACIONES_VER, P.EVALUACIONES_DILIGENCIAR, P.REPORTES_VER, P.PREDIOS_PROPIOS] },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/evaluations/evaluation-page/evaluation-page').then((m) => m.EvaluationPage),
      },
      {
        path: 'usuarios',
        title: 'Usuarios | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.USUARIOS_VER, P.USUARIOS_GESTIONAR] },
        loadComponent: () => import('./features/users/users-page/users-page').then((m) => m.UsersPage),
      },
      {
        path: 'roles',
        title: 'Roles y permisos | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.ROLES_VER] },
        loadComponent: () => import('./features/roles/roles-page/roles-page').then((m) => m.RolesPage),
      },
      {
        path: 'roles/nuevo',
        title: 'Nuevo rol | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.ROLES_GESTIONAR] },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/roles/role-editor/role-editor').then((m) => m.RoleEditor),
      },
      {
        path: 'roles/:id',
        title: 'Rol | ICA Bienestar Animal',
        canActivate: [permissionGuard],
        data: { permissions: [P.ROLES_VER] },
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/roles/role-editor/role-editor').then((m) => m.RoleEditor),
      },
      {
        path: 'mi-cuenta',
        title: 'Cuenta | ICA Bienestar Animal',
        canDeactivate: [unsavedChangesGuard],
        loadComponent: () => import('./features/account/account-page/account-page').then((m) => m.AccountPage),
      },
    ],
  },
  { path: '**', redirectTo: 'inicio' },
];
