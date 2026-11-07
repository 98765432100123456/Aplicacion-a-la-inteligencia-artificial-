import { expect, test } from '@playwright/test';
import { expectAccessible, expectNoHorizontalOverflow, login } from './helpers';

test.describe('Predios y evaluaciones', () => {
  // Varias escrituras en Firestore y la generación de los PDF en el navegador.
  test.setTimeout(60_000);

  test('registra un predio, lo evalúa, finaliza y descarga los informes', async ({ page }) => {
    const nombre = `Predio prueba ${Date.now()}`;
    await login(page);
    await page.goto('/predios/nuevo');
    await page.getByLabel('Nombre de la finca o predio').fill(nombre);
    await page.getByLabel('Departamento').fill('Cundinamarca');
    await page.getByLabel('Municipio').fill('Ubaté');
    await page.getByLabel('Nombre del propietario').fill('Pedro Pérez');
    await page.getByLabel('Teléfono de contacto').fill('3104567890');
    await page.getByLabel('Sistema productivo').selectOption({ label: 'Lechería' });
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
    // Lechería: la castración no aplica y la mastitis sí.
    await expect(page.getByRole('heading', { name: 'Presencia de mastitis clínica' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Castración' })).toHaveCount(0);
    const grupos = await page.locator('input[type=radio]').evaluateAll((xs) => [...new Set(xs.map((x) => (x as HTMLInputElement).name))]);
    for (const g of grupos) await page.locator(`input[name="${g}"][value="CUMPLE"]`).check();
    // Árboles de escenarios: se elige la primera opción de cada pregunta hasta terminar el recorrido.
    const agua = page.locator('#arbol-agua');
    await agua.locator('select').first().selectOption({ index: 1 });
    await expect(agua.locator('.marcador')).toContainText('3 de 14 puntos');
    const pendiente = page.locator('.paso.pendiente select');
    while (await pendiente.count()) await pendiente.first().selectOption({ index: 1 });
    await expect(agua.locator('.marcador')).toContainText('14 de 14 puntos');
    await expect(agua.getByText('Excelente')).toBeVisible();
    // Cambiar una respuesta anterior recorta el camino y recalcula el puntaje.
    await agua.locator('select').first().selectOption({ label: 'Sí, al menos el 50 % (+1 punto)' });
    await expect(agua.locator('.marcador')).toContainText('1 de 14 puntos');
    await expect(agua.locator('select')).toHaveCount(1);
    await agua.locator('select').first().selectOption({ index: 0 });
    while (await pendiente.count()) await pendiente.first().selectOption({ index: 1 });
    await expect(agua.locator('.marcador')).toContainText('14 de 14 puntos');
    await expect(page.getByText(/Guardado a las/)).toBeVisible({ timeout: 10_000 });
    await expectAccessible(page);

    await page.getByRole('button', { name: 'Finalizar' }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Finalizar' }).click();
    // Pantalla de resultado: el nivel de los árboles ya decía "Excelente" en el formulario.
    await expect(page.getByRole('button', { name: /Informe técnico/ })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText('Excelente').first()).toBeVisible();
    await expectAccessible(page);

    const descarga = page.waitForEvent('download');
    await page.getByRole('button', { name: /Informe técnico/ }).click();
    expect((await descarga).suggestedFilename()).toMatch(/^informe-tecnico-.+\.pdf$/);

    await page.goto('/predios');
    await page.getByRole('link', { name: new RegExp(nombre) }).click();
    await page.getByText('Recomendaciones', { exact: true }).click();
    await expect(page.getByRole('button', { name: /Informe para el propietario/ })).toBeVisible();
  });
});
