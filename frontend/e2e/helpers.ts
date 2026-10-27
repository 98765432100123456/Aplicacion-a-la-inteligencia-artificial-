import AxeBuilder from '@axe-core/playwright';
import { expect, Page } from '@playwright/test';

export const ADMIN = {
  email: process.env.E2E_ADMIN_EMAIL ?? 'admin@ica-bienestar.local',
  password: process.env.E2E_ADMIN_PASSWORD ?? 'CambiarEsta.2026',
};

export async function login(page: Page, email = ADMIN.email, password = ADMIN.password) {
  await page.goto('/ingresar');
  await page.getByLabel('Correo electrónico').fill(email);
  await page.getByLabel('Contraseña', { exact: true }).fill(password);
  await page.getByRole('button', { name: 'Ingresar' }).click();
  await expect(page).toHaveURL(/\/inicio/);
}

/** 0 violaciones de axe (WCAG 2.1 A/AA). */
export async function expectAccessible(page: Page) {
  // Las animaciones de entrada parten de opacidad 0: se mide el contraste ya en reposo.
  await page.evaluate(() => Promise.all(document.getAnimations().map((a) => a.finished.catch(() => undefined))));
  const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
  expect(results.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`)).toEqual([]);
}

/** Sin desplazamiento horizontal. */
export async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
}

/** Botones y controles visibles de al menos 44 px de alto (en el control segmentado, la etiqueta es el objetivo táctil). */
export async function expectTouchTargets(page: Page) {
  const small = await page.evaluate(() =>
    [...document.querySelectorAll<HTMLElement>('button, .btn, input:not([type=checkbox]):not([type=radio]), select, nav a, .segmentado label')]
      .filter((el) => el.offsetParent !== null)
      .filter((el) => el.getBoundingClientRect().height < 43.5)
      .map((el) => el.outerHTML.slice(0, 80)),
  );
  expect(small).toEqual([]);
}

/**
 * Espera a que la pantalla termine de cargar. No se usa "networkidle": Firestore mantiene
 * abierta una conexión para avisar cambios del rol, así que la red nunca queda quieta.
 */
export async function esperarCarga(page: Page) {
  await page.locator('[role=status]:has-text("Cargando"), [aria-busy=true]').first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => undefined);
  await expect(page.locator('[role=status]:has-text("Cargando")')).toHaveCount(0, { timeout: 15_000 });
  await expect(page.locator('[aria-busy=true]')).toHaveCount(0, { timeout: 15_000 });
}
