// Copia las reglas compartidas (carpeta compartido/) al servicio y a la interfaz.
// Uso: node scripts/compartido.mjs            copia los archivos
//      node scripts/compartido.mjs --verificar  falla si alguna copia está desactualizada
import { mkdirSync, readdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');
const origen = join(raiz, 'compartido');
const destinos = [join(raiz, 'backend/src/compartido'), join(raiz, 'frontend/src/app/compartido')];
const verificar = process.argv.includes('--verificar');
const encabezado = (archivo) =>
  `// ARCHIVO GENERADO desde compartido/${archivo}. No lo edite aquí: edite el original y ejecute node scripts/compartido.mjs\n\n`;

let desactualizados = 0;
for (const archivo of readdirSync(origen).filter((f) => f.endsWith('.ts'))) {
  const contenido = encabezado(archivo) + readFileSync(join(origen, archivo), 'utf8');
  for (const destino of destinos) {
    const ruta = join(destino, archivo);
    if (verificar) {
      if (!existsSync(ruta) || readFileSync(ruta, 'utf8') !== contenido) {
        console.error(`Desactualizado: ${ruta}`);
        desactualizados++;
      }
    } else {
      mkdirSync(destino, { recursive: true });
      writeFileSync(ruta, contenido);
    }
  }
}
if (verificar && desactualizados) {
  console.error('Ejecute: node scripts/compartido.mjs');
  process.exit(1);
}
console.log(verificar ? 'Las copias de compartido/ están al día.' : 'Copias de compartido/ actualizadas.');
