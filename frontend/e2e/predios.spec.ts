import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, login } from './helpers';

test.describe('Predios y evaluaciones', () => {
  test('registra un predio, lo evalúa, finaliza y descarga los informes', async ({ page }) => {
    const nombre = `Predio prueba ${Date.now()}`;
    await login(page);
    await page.goto('/predios/nuevo');
    await page.getByLabel('Nombre de la finca o predio').fill(nombre);
    await page.getByLabel('Departamento').fill('Cundinamarca');
    await page.getByLabel('Municipio').fill('Ubaté');
    await page.getByLabel('Nombre del propietario').fill('Pedro Pérez');
    await page.getByLabel('Teléfono de contacto').fill('3104567890');
    await page.getByLabel('Especie').selectOption({ label: 'Bovinos' });
    await page.getByLabel('Crías').fill('18');
    await page.getByLabel('Jóvenes').fill('34');
    await page.getByLabel('Adultos').fill('68');
    await expect(page.getByText(/Mediano productor/).first()).toBeVisible();
    await expectAccessible(page);
    await page.getByRole('button', { name: /Registrar predio/ }).click();

    await expect(page.getByRole('heading', { name: nombre })).toBeVisible();
    await expect(page.getByText('muestra mínima de 30 animales')).toBeVisible();
    await expectAccessible(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: /Realizar evaluación/ }).click();
    await expect(page).toHaveURL(/\/evaluaciones\//);
    const grupos = await page.locator('input[type=radio]').evaluateAll((xs) => [...new Set(xs.map((x) => (x as HTMLInputElement).name))]);
    for (const g of grupos) await page.locator(`input[name="${g}"][value="CUMPLE"]`).check();
    await expect(page.getByText(/Guardado a las/)).toBeVisible({ timeout: 10_000 });
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Finalizar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click();
    await expect(page.getByText('Excelente').first()).toBeVisible({ timeout: 30_000 });
    await expectAccessible(page);

    const descarga = page.waitForEvent('download');
    await page.getByRole('button', { name: /Informe técnico/ }).click();
    expect((await descarga).suggestedFilename()).toMatch(/^informe-tecnico-.+\.pdf$/);

    await page.goto('/predios');
    await page.getByRole('link', { name: new RegExp(nombre) }).click();
    await page.getByText('Recomendaciones IA').click();
    await expect(page.getByRole('button', { name: /Informe para el propietario/ })).toBeVisible();
  });
});
