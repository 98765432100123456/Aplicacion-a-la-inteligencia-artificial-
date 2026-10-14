import { expect, test } from '@playwright/test';
import { ADMIN, expectAccessible, expectNoHorizontalOverflow, expectTouchTargets, login } from './helpers';

test.describe('Ingreso', () => {
  test('valida los campos y explica el error', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByText('Escriba un correo válido')).toBeVisible();
    await expect(page.getByText('Escriba su contraseña.')).toBeVisible();
    await expect(page.getByLabel('Correo electrónico')).toBeFocused();
  });

  test('rechaza credenciales incorrectas', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByLabel('Correo electrónico').fill('nadie@prueba.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta123');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('alert')).toHaveText('Correo o contraseña incorrectos.');
  });

  test('muestra u oculta la contraseña', async ({ page }) => {
    await page.goto('/ingresar');
    const field = page.getByLabel('Contraseña', { exact: true });
    await field.fill('secreta');
    await expect(field).toHaveAttribute('type', 'password');
    await page.getByRole('button', { name: 'Mostrar contraseña' }).click();
    await expect(field).toHaveAttribute('type', 'text');
  });

  test('ingresa, vuelve a la página pedida y cierra sesión', async ({ page, isMobile }) => {
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/ingresar\?volver=%2Fusuarios/);
    await page.getByLabel('Correo electrónico').fill(ADMIN.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(ADMIN.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page).toHaveURL(/\/usuarios/);
    if (isMobile) await page.getByRole('button', { name: 'Menú' }).click();
    await page.getByRole('button', { name: 'Cerrar sesión' }).click();
    await expect(page).toHaveURL(/\/ingresar/);
    await page.goto('/inicio');
    await expect(page).toHaveURL(/\/ingresar/);
  });

  test('las pantallas públicas cumplen accesibilidad y diseño responsivo', async ({ page }) => {
    for (const path of ['/ingresar', '/recuperar-contrasena', '/restablecer-contrasena?token=x']) {
      await page.goto(path);
      await page.locator('h2').first().waitFor();
      await expectAccessible(page);
      await expectNoHorizontalOverflow(page);
      await expectTouchTargets(page);
    }
  });
});

test.describe('Recuperación de contraseña', () => {
  test('confirma el envío sin revelar si el correo existe', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByRole('link', { name: '¿Olvidó su contraseña?' }).click();
    await page.getByLabel('Correo electrónico').fill('cualquiera@prueba.co');
    await page.getByRole('button', { name: 'Enviar enlace' }).click();
    await expect(page.getByRole('heading', { name: 'Revise su correo' })).toBeVisible();
    await expect(page.getByText('cualquiera@prueba.co')).toBeVisible();
  });

  test('avisa cuando el enlace no sirve', async ({ page }) => {
    await page.goto('/restablecer-contrasena?token=token-invalido');
    await expect(page.getByRole('heading', { name: 'El enlace ya no sirve' })).toBeVisible();
    await page.getByRole('link', { name: 'Pedir un enlace nuevo' }).click();
    await expect(page).toHaveURL(/\/recuperar-contrasena/);
  });
});

test('las pantallas internas cumplen accesibilidad y diseño responsivo', async ({ page }) => {
  await login(page);
  for (const path of ['/inicio', '/usuarios', '/roles', '/mi-cuenta']) {
    await page.goto(path);
    await page.locator('h1').first().waitFor();
    await page.waitForLoadState('networkidle');
    await expectAccessible(page);
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);
  }
});
