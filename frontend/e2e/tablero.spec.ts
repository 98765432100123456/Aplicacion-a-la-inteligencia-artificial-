import { expect, test } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { esperarCarga, expectAccessible, expectNoHorizontalOverflow, expectTouchTargets, login } from './helpers';

test.describe('Tablero', () => {
  test('muestra las cifras, genera el análisis y exporta a Excel y PDF', async ({ page, isMobile }) => {
    await login(page);
    if (isMobile) await page.getByRole('button', { name: 'Menú' }).click();
    await page.getByRole('link', { name: 'Tablero' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Tablero' })).toBeVisible();
    await esperarCarga(page);
    await expect(page.getByText('Evaluaciones finalizadas', { exact: true })).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);

    // El periodo cambia las cifras sin recargar.
    await page.getByText('Últimos 90 días').click();
    await expect(page.getByRole('radio', { name: 'Últimos 90 días' })).toBeChecked();

    // Exportar a PDF siempre está disponible; Excel solo con evaluaciones finalizadas.
    const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Reporte PDF' }).click()]);
    expect(pdf.suggestedFilename()).toMatch(/^reporte-tablero-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(readFileSync(await pdf.path()).subarray(0, 4).toString()).toBe('%PDF');

    await page.getByText('Todo', { exact: true }).click();
    const excel = page.getByRole('button', { name: 'Exportar a Excel' });
    if (await excel.isEnabled()) {
      await expect(page.getByRole('heading', { name: 'Evaluaciones por nivel' })).toBeVisible();
      const [csv] = await Promise.all([page.waitForEvent('download'), excel.click()]);
      expect(csv.suggestedFilename()).toMatch(/^evaluaciones-bienestar-.*\.csv$/);
      const texto = readFileSync(await csv.path(), 'utf8');
      expect(texto.startsWith('\uFEFF"Código";"Predio"')).toBe(true);

      // En los emuladores no hay IA: responde el análisis por reglas.
      await page.getByRole('button', { name: 'Generar análisis con IA' }).click();
      await expect(page.getByRole('heading', { name: 'Lo que muestran las cifras' })).toBeVisible();
      await expect(page.getByText(/Generado (con inteligencia artificial|por reglas)/)).toBeVisible();
      await expectAccessible(page);
    }
  });
});
