import { expect, test } from '@playwright/test';
import { expectAccessible, login } from './helpers';

test.describe('Gestión de usuarios', () => {
  test('crea, busca, edita e inactiva un usuario', async ({ page }) => {
    const stamp = Date.now();
    const email = `prueba.${stamp}@ica-bienestar.local`;
    await login(page);
    await page.goto('/usuarios');

    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo usuario' });
    await expect(dialog).toBeVisible();
    await expectAccessible(page);

    await dialog.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(dialog.getByText('Escriba los nombres')).toBeVisible();

    await dialog.getByLabel('Nombres').fill('Laura');
    await dialog.getByLabel('Apellidos').fill(`Prueba ${stamp}`);
    await dialog.getByLabel('Correo electrónico').fill(email);
    await dialog.getByLabel('Rol').selectOption({ label: 'Evaluador' });
    await dialog.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(page.getByRole('status').getByText(`Usuario creado. Enviamos a ${email}`)).toBeVisible();

    await page.getByLabel('Buscar').fill(String(stamp));
    const row = page.locator('tbody tr', { hasText: email });
    await expect(row).toHaveCount(1);
    await expect(row.getByText('Evaluador')).toBeVisible();

    await row.getByRole('button', { name: /Editar/ }).click();
    const edit = page.getByRole('dialog', { name: 'Editar usuario' });
    await edit.getByLabel('Teléfono').fill('3001234567');
    await edit.getByLabel('Rol').selectOption({ label: 'Consultor externo' });
    await edit.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(row.getByText('Consultor externo')).toBeVisible();

    await row.getByRole('button', { name: /Inactivar/ }).click();
    const confirm = page.getByRole('dialog', { name: 'Inactivar usuario' });
    await confirm.getByRole('button', { name: 'Inactivar' }).click();
    await expect(row.getByText('Inactivo')).toBeVisible();

    await row.getByRole('button', { name: /Activar/ }).click();
    await expect(row.getByText('Activo', { exact: true })).toBeVisible();
  });

  test('no permite correos repetidos', async ({ page }) => {
    await login(page);
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo usuario' });
    await dialog.getByLabel('Nombres').fill('Otro');
    await dialog.getByLabel('Apellidos').fill('Admin');
    await dialog.getByLabel('Correo electrónico').fill('admin@ica-bienestar.local');
    await dialog.getByLabel('Rol').selectOption({ label: 'Evaluador' });
    await dialog.getByRole('button', { name: 'Crear usuario' }).click();
    await expect(dialog.getByRole('alert')).toHaveText('Ya existe un usuario con ese correo.');
  });
});

test.describe('Gestión de roles', () => {
  test('crea un rol, ajusta permisos por módulo y lo inactiva', async ({ page }) => {
    const code = `QA_${Date.now()}`;
    await login(page);
    await page.goto('/roles');
    await page.getByRole('link', { name: 'Nuevo rol' }).click();
    await page.getByLabel('Nombre').fill(`Rol de prueba ${code}`);
    await page.getByLabel('Código').fill(code);
    await page.getByRole('switch', { name: 'Reportes', exact: true }).check();
    await page.getByRole('switch', { name: 'Consultar todos los predios' }).check();
    await expect(page.getByText('2 seleccionados')).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('button', { name: 'Crear rol' }).click();

    await expect(page).toHaveURL(/\/roles$/);
    await page.getByRole('link', { name: `Rol de prueba ${code}` }).click();
    await expect(page.getByRole('switch', { name: 'Consultar todos los predios' })).toBeChecked();
    await page.getByRole('button', { name: 'Inactivar rol' }).click();
    await page.getByRole('dialog', { name: 'Inactivar rol' }).getByRole('button', { name: 'Inactivar' }).click();
    await expect(page.locator('.titulo').getByText('Inactivo')).toBeVisible();
  });

  test('el rol Administrador conserva todos los permisos', async ({ page }) => {
    await login(page);
    await page.goto('/roles');
    await page.getByRole('link', { name: 'Administrador' }).click();
    await expect(page.getByText('conserva todos los permisos')).toBeVisible();
    await expect(page.getByRole('switch', { name: 'Consultar usuarios' })).toBeDisabled();
  });
});
