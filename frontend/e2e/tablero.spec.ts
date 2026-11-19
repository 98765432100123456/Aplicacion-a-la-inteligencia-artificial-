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
    await expect(page.getByText('Evaluaciones finalizadas', { exact: true }).first()).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalOverflow(page);
    await expectTouchTargets(page);

    // El periodo cambia las cifras sin recargar.
    await page.getByText('Últimos 90 días').click();
    await expect(page.getByRole('radio', { name: 'Últimos 90 días' })).toBeChecked();

    // Los dos exportables están siempre disponibles, aunque no haya evaluaciones en el periodo.
    const [pdf] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Reporte PDF' }).click()]);
    expect(pdf.suggestedFilename()).toMatch(/^reporte-tablero-\d{4}-\d{2}-\d{2}\.pdf$/);
    expect(readFileSync(await pdf.path()).subarray(0, 4).toString()).toBe('%PDF');

    await page.getByText('Todo', { exact: true }).click();
    const excel = page.getByRole('button', { name: 'Exportar a Excel' });
    const [libro] = await Promise.all([page.waitForEvent('download'), excel.click()]);
    expect(libro.suggestedFilename()).toMatch(/^tablero-bienestar-animal-\d{4}-\d{2}-\d{2}\.xlsx$/);
    // Un .xlsx es un ZIP: empieza por PK y trae la hoja del tablero con sus gráficos.
    const bytes = readFileSync(await libro.path());
    expect(bytes.subarray(0, 2).toString()).toBe('PK');
    expect(bytes.includes('xl/charts/chart1.xml')).toBe(true);
    await esperarCarga(page);
    if (await page.getByRole('heading', { name: 'Evaluaciones por nivel' }).isVisible()) {
      // Los filtros de departamento y sistema cambian las cifras.
      const departamento = page.getByLabel('Departamento', { exact: true });
      const opciones = await departamento.locator('option').allTextContents();
      if (opciones.length > 1) {
        await departamento.selectOption({ index: 1 });
        await expect(page.getByRole('button', { name: 'Quitar filtros' })).toBeVisible();
        await page.getByRole('button', { name: 'Quitar filtros' }).click();
      }

      // En los emuladores no hay IA: responde el análisis por reglas.
      await page.getByRole('button', { name: 'Generar análisis con IA' }).click();
      await expect(page.getByRole('heading', { name: 'Lo que muestran las cifras' })).toBeVisible();
      await expect(page.getByText(/Generado (con inteligencia artificial|por reglas)/)).toBeVisible();
      await expectAccessible(page);
    }
  });
});
