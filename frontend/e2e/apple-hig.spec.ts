import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, login } from './helpers';

/**
 * Criterios de la revisión con Apple HIG (skill apple-design):
 * modo oscuro, contraste aumentado, texto al 200 %, teclado y pérdida de datos.
 */

test.describe('Apariencia del sistema', () => {
  test('el modo oscuro cumple accesibilidad en todas las pantallas', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/ingresar');
    await page.locator('h2').first().waitFor();
    await expectAccessible(page);
    await login(page);
    for (const path of ['/inicio', '/predios', '/predios/nuevo', '/usuarios', '/roles', '/mi-cuenta']) {
      await page.goto(path);
      await page.locator('h1').first().waitFor();
      await page.waitForLoadState('networkidle');
      await expectAccessible(page);
    }
    const fondo = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(fondo).toBe('rgb(14, 18, 16)');
  });

  test('con contraste aumentado los bordes de los campos se refuerzan', async ({ page }) => {
    await page.emulateMedia({ contrast: 'more' } as never);
    await page.goto('/ingresar');
    const borde = await page.getByLabel('Correo electrónico').evaluate((el) => getComputedStyle(el).borderTopColor);
    expect(borde).toBe('rgb(61, 69, 63)');
  });

  test('el texto al 200 % no rompe el diseño', async ({ page }) => {
    // Simula el ajuste de tamaño de letra del navegador (no el zoom): 16 px → 32 px.
    const cdp = await page.context().newCDPSession(page);
    await cdp.send('Page.setFontSizes', { fontSizes: { standard: 32, fixed: 26 } });
    await login(page);
    for (const path of ['/inicio', '/usuarios', '/roles', '/mi-cuenta']) {
      await page.goto(path);
      await page.locator('h1').first().waitFor();
      await page.waitForLoadState('networkidle');
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe('Teclado y modales', () => {
  test('el menú móvil se abre, recibe el foco y se cierra con Escape', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Solo aplica al cajón del celular');
    await login(page);
    const menu = page.getByRole('button', { name: 'Menú' });
    await menu.click();
    await expect(page.getByRole('navigation', { name: 'Principal' }).getByRole('link', { name: 'Inicio' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(menu).toBeFocused();
    await expect(menu).toHaveAttribute('aria-expanded', 'false');
  });

  test('pide confirmación antes de descartar un usuario a medio escribir', async ({ page }) => {
    await login(page);
    await page.goto('/usuarios');
    await page.getByRole('button', { name: 'Nuevo usuario' }).click();
    const dialog = page.getByRole('dialog', { name: 'Nuevo usuario' });
    await dialog.getByLabel('Nombres').fill('Andrea');
    await page.keyboard.press('Escape');
    await expect(dialog.getByText('Hay cambios sin guardar.')).toBeVisible();
    await dialog.getByRole('button', { name: 'Seguir editando' }).click();
    await expect(dialog.getByLabel('Nombres')).toHaveValue('Andrea');
    await dialog.getByRole('button', { name: 'Cancelar' }).click();
    await dialog.getByRole('button', { name: 'Descartar cambios' }).click();
    await expect(dialog).toBeHidden();
  });

  test('el diálogo destructivo enfoca Cancelar por defecto', async ({ page }) => {
    await login(page);
    await page.goto('/usuarios');
    const row = page.locator('tbody tr', { has: page.getByRole('button', { name: /Inactivar/ }) }).first();
    await row.getByRole('button', { name: /Inactivar/ }).click();
    const confirm = page.getByRole('dialog', { name: 'Inactivar usuario' });
    await expect(confirm.getByRole('button', { name: 'Cancelar' })).toBeFocused();
    await page.keyboard.press('Escape');
    await expect(confirm).toBeHidden();
  });

  test('los botones responden al presionarlos', async ({ page }) => {
    await page.goto('/ingresar');
    const boton = page.getByRole('button', { name: 'Ingresar' });
    const box = (await boton.boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await page.waitForTimeout(200);
    const transform = await boton.evaluate((el) => getComputedStyle(el).transform);
    await page.mouse.up();
    expect(transform).toMatch(/matrix\(0\.97/);
  });
});
