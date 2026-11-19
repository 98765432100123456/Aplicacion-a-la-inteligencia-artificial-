// Prepara la vista previa que se publica como página de claude.ai (npm run vista en frontend/):
// esa página recibe solo el contenido, sin <!doctype>, <html>, <head> ni <body>, así que se
// extraen el título, la hoja de estilos y los scripts de index.html a dist/vista/browser/pagina.html.
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const dir = fileURLToPath(new URL('../frontend/dist/vista/browser/', import.meta.url));
const html = readFileSync(join(dir, 'index.html'), 'utf8');
const etiquetas = (re) => html.match(re) ?? [];
const titulo = '<title>ICA Bienestar Animal</title>';
const estilos = etiquetas(/<link[^>]+rel="stylesheet"[^>]*>/g);
const icono = etiquetas(/<link[^>]+rel="icon"[^>]*>/g);
const scripts = etiquetas(/<script\b[^>]*src="[^"]+"[^>]*><\/script>/g);
const precarga = etiquetas(/<link[^>]+rel="modulepreload"[^>]*>/g);
const pagina = [titulo, ...icono, ...estilos, ...precarga, '<app-root></app-root>', ...scripts].join('\n') + '\n';
writeFileSync(join(dir, 'pagina.html'), pagina);

const recorrer = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? recorrer(join(d, f)) : [join(d, f)]));
const archivos = recorrer(dir)
  .map((f) => relative(dir, f))
  .filter((f) => !['index.html', 'pagina.html', 'robots.txt', 'sitemap.xml', 'manifest.webmanifest'].includes(f) && !f.startsWith('.well-known') && !f.endsWith('.xlsx'));
// La vista previa no sirve archivos .xlsx (ni permite descargas), así que la plantilla de Excel no se publica.
writeFileSync(join(dir, 'archivos.json'), JSON.stringify(archivos, null, 2));
console.log(`✔ Vista lista: pagina.html y ${archivos.length} archivos`);
