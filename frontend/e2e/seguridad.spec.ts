import { expect, Page, test } from '@playwright/test';
import { ADMIN, esperarCarga, login, verificarCodigo } from './helpers';

/**
 * Regresión de seguridad en el navegador, como en Forja Digital (tests/regresion-seguridad.mjs).
 * Cada prueba reproduce un ataque o una entrada maliciosa y comprueba que no tiene efecto.
 */

/** Falla si la página abre un diálogo (alert) o lanza un error sin capturar. */
function vigilar(page: Page) {
  const problemas: string[] = [];
  page.on('dialog', (d) => {
    problemas.push(`diálogo: ${d.message()}`);
    void d.dismiss();
  });
  page.on('pageerror', (e) => problemas.push(`error: ${e.message}`));
  return problemas;
}

test.describe('Regresión de seguridad', () => {
  test('S1 · una dirección con % mal formado no deja la página en blanco', async ({ page }) => {
    await login(page);
    await esperarCarga(page);
    // El servidor de desarrollo rechaza la dirección antes de cargar la aplicación; en producción la
    // atiende Hosting. Aquí se prueba la aplicación: navegar a ella desde adentro, como un enlace compartido.
    await page.evaluate(() => {
      history.pushState({}, '', '/predios/%E0%A4%A');
      dispatchEvent(new PopStateEvent('popstate'));
    });
    await page.waitForTimeout(500);
    await expect(page.getByRole('banner')).toBeVisible();
    await expect(page.locator('main h1').first()).toBeVisible();
    // La aplicación sigue respondiendo.
    await page.getByRole('link', { name: 'ICA Bienestar, inicio' }).click();
    await expect(page).toHaveURL(/\/inicio/);
  });

  test('S2 · el ingreso no redirige a sitios externos (redirección abierta)', async ({ page }) => {
    for (const volver of ['//sitio-malicioso.example', '/\\sitio-malicioso.example', 'javascript:alert(1)']) {
      await page.goto(`/ingresar?volver=${encodeURIComponent(volver)}`);
      await page.getByLabel('Correo electrónico').fill(ADMIN.email);
      await page.getByLabel('Contraseña', { exact: true }).fill(ADMIN.password);
      await page.getByRole('button', { name: 'Ingresar' }).click();
      await verificarCodigo(page);
      await expect(page).toHaveURL(/^http:\/\/localhost:4200\/inicio/);
      await page.context().clearCookies();
      await page.evaluate(() => sessionStorage.clear());
    }
  });

  test('S3 · texto con HTML o scripts se muestra como texto y no se ejecuta (XSS)', async ({ page }) => {
    const problemas = vigilar(page);
    await login(page);
    await esperarCarga(page);
    await page.getByRole('button', { name: 'Asistente de bienestar animal' }).click();
    const panel = page.getByRole('dialog', { name: 'Clara' });
    const ataque = '<img src=x onerror=alert(1)><script>alert(2)</script>';
    await panel.getByLabel('Escriba su pregunta').fill(ataque);
    await panel.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(panel.getByRole('log')).toContainText('<img src=x onerror=alert(1)>');
    await expect(page.locator('img[src="x"], .registro script')).toHaveCount(0);
    expect(problemas).toEqual([]);
  });

  test('S4 · un fragmento # con HTML no se ejecuta', async ({ page }) => {
    const problemas = vigilar(page);
    await page.goto('/ingresar#%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E');
    await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
    await expect(page.locator('img[src="x"]')).toHaveCount(0);
    expect(problemas).toEqual([]);
  });

  test('S5 · sin el código del correo no se entra aunque la contraseña sea correcta', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByLabel('Correo electrónico').fill(ADMIN.email);
    await page.getByLabel('Contraseña', { exact: true }).fill(ADMIN.password);
    await page.getByRole('button', { name: 'Ingresar' }).click();
    await expect(page.getByRole('heading', { name: 'Verifique que es usted' })).toBeVisible();
    // Saltarse la pantalla escribiendo la dirección no sirve: la sesión sin verificar se cierra.
    await page.goto('/usuarios');
    await expect(page).toHaveURL(/\/ingresar/);
  });

  test('S6 · los errores no muestran detalles técnicos', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByLabel('Correo electrónico').fill('nadie@prueba.co');
    await page.getByLabel('Contraseña', { exact: true }).fill('incorrecta123');
    await page.getByRole('button', { name: 'Ingresar' }).click();
    const alerta = page.getByRole('alert');
    await expect(alerta).toHaveText('Correo o contraseña incorrectos.');
    await expect(alerta).not.toContainText(/auth\/|firebase|Error|stack/i);
  });
});
