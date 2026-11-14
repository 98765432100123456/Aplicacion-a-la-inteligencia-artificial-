import { expect, test } from '@playwright/test';
import { esperarCarga, expectAccessible, expectNoHorizontalOverflow, expectTouchTargets, login } from './helpers';

test.describe('Sitio público', () => {
  test.describe('primera visita', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    test('muestra el aviso de cookies una sola vez', async ({ page }) => {
      await page.goto('/ingresar');
      const aviso = page.getByRole('region', { name: 'Su privacidad' });
      await expect(aviso).toBeVisible();
      await expectAccessible(page);
      await expectTouchTargets(page);
      await aviso.getByRole('button', { name: 'Entendido' }).click();
      await expect(aviso).toBeHidden();
      await page.reload();
      await expect(page.getByRole('heading', { name: 'Ingresar' })).toBeVisible();
      await expect(page.getByRole('region', { name: 'Su privacidad' })).toBeHidden();
    });
  });

  test('las páginas legales se leen sin sesión y cumplen accesibilidad', async ({ page }) => {
    await page.goto('/ingresar');
    await page.getByRole('navigation', { name: 'Información legal' }).getByRole('link', { name: 'Privacidad' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Política de tratamiento de datos personales' })).toBeVisible();
    await expect(page.getByText('Ley 1581 de 2012').first()).toBeVisible();
    for (const [ruta, titulo] of [
      ['/privacidad', 'Política de tratamiento de datos personales'],
      ['/terminos', 'Términos y condiciones de uso'],
      ['/cookies', 'Política de cookies y almacenamiento'],
    ]) {
      await page.goto(ruta);
      await expect(page.getByRole('heading', { level: 1, name: titulo })).toBeVisible();
      await expectAccessible(page);
      await expectNoHorizontalOverflow(page);
      await expectTouchTargets(page);
    }
    await page.getByRole('link', { name: 'Volver al ingreso' }).click();
    await expect(page).toHaveURL(/\/ingresar/);
  });
});

test.describe('Asistente Clara', () => {
  test('responde las preguntas establecidas y se cierra con Escape', async ({ page }) => {
    await login(page);
    await esperarCarga(page);
    const lanzador = page.getByRole('button', { name: 'Asistente de bienestar animal' });
    await lanzador.click();
    const panel = page.getByRole('dialog', { name: 'Clara' });
    await expect(panel).toBeVisible();
    await expect(panel.getByText('Soy Clara')).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);

    await panel.getByRole('button', { name: '¿Qué significa cada nivel?' }).click();
    const conversacion = panel.getByRole('log', { name: 'Conversación con Clara' });
    await expect(conversacion).toContainText('Excelente: 4,6 a 5,0');
    // La pregunta respondida sale de las sugeridas.
    await expect(panel.getByRole('button', { name: '¿Qué significa cada nivel?' })).toHaveCount(0);

    // Pregunta escrita: en los emuladores no hay IA, responde con la base establecida.
    await panel.getByLabel('Escriba su pregunta').fill('¿cuántos animales debo revisar en la muestra?');
    await panel.getByRole('button', { name: 'Enviar pregunta' }).click();
    await expect(conversacion).toContainText('se revisan 20');

    await panel.getByRole('button', { name: 'Más preguntas' }).click();
    await panel.getByRole('button', { name: '¿Cómo protegen mis datos?' }).click();
    await conversacion.getByRole('link', { name: 'Leer la política de privacidad' }).click();
    await expect(page).toHaveURL(/\/privacidad/);
    await expect(page.getByRole('link', { name: 'Volver al inicio' })).toBeVisible();

    await page.goto('/inicio');
    await page.getByRole('button', { name: 'Asistente de bienestar animal' }).click();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Clara' })).toBeHidden();
    await expect(page.getByRole('button', { name: 'Asistente de bienestar animal' })).toBeFocused();
  });
});
