// Escribe frontend/dist/frontend/browser/version.json al compilar. La aplicación abierta lo consulta
// cada pocos minutos y, cuando cambia, ofrece actualizar sin volver a descargar nada (ActualizacionService).
import { execFileSync } from 'node:child_process';
import { existsSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const dist = fileURLToPath(new URL('../frontend/dist/frontend/browser/', import.meta.url));
if (!existsSync(dist)) {
  console.error('No existe la compilación; ejecute npm run build en frontend/.');
  process.exit(1);
}
let commit = process.env.GITHUB_SHA ?? '';
try {
  commit ||= execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim();
} catch {
  // Sin Git (por ejemplo, un ZIP descargado): basta la fecha de compilación.
}
const fecha = new Date().toISOString();
const version = { version: `${commit.slice(0, 12) || 'local'}-${fecha}`, commit: commit.slice(0, 12) || null, compilado: fecha };
writeFileSync(dist + 'version.json', JSON.stringify(version) + '\n');
console.log(`✔ Versión ${version.version}`);
