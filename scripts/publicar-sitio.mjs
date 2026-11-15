// Publica frontend/dist/frontend/browser en Firebase Hosting con la API REST, sin la herramienta
// de Firebase ni una cuenta de servicio: sirve cuando solo se tiene un token de acceso temporal.
// Usa la misma configuración de firebase.json (cabeceras, reescritura y URL limpias).
//
//   FIREBASE_TOKEN_ACCESO=<token>  node scripts/publicar-sitio.mjs
//
// Sin la variable, envía un valor de relleno: en las sesiones en la nube el proxy pone la credencial.
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { gzipSync } from 'node:zlib';

const SITIO = 'bienestar-animal-ica';
const API = 'https://firebasehosting.googleapis.com/v1beta1';
const RAIZ = fileURLToPath(new URL('..', import.meta.url));
const DIST = join(RAIZ, 'frontend/dist/frontend/browser');
const TOKEN = process.env.FIREBASE_TOKEN_ACCESO || 'relleno-lo-reemplaza-el-proxy';
const temporal = mkdtempSync(join(tmpdir(), 'publicar-'));

function pedir(metodo, url, cuerpo, tipo = 'application/json') {
  const archivo = join(temporal, 'cuerpo');
  const args = ['-sS', '-X', metodo, url, '-H', `Authorization: Bearer ${TOKEN}`, '-w', '\n%{http_code}'];
  if (cuerpo !== undefined) {
    writeFileSync(archivo, typeof cuerpo === 'string' || Buffer.isBuffer(cuerpo) ? cuerpo : JSON.stringify(cuerpo));
    args.push('-H', `Content-Type: ${tipo}`, '--data-binary', `@${archivo}`);
  }
  const salida = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  const corte = salida.lastIndexOf('\n');
  const estado = Number(salida.slice(corte + 1));
  const texto = salida.slice(0, corte);
  if (estado < 200 || estado >= 300) throw new Error(`${metodo} ${url.replace(API, '')} → ${estado}: ${texto.slice(0, 400)}`);
  return texto ? JSON.parse(texto) : {};
}

try {
  if (!existsSync(join(DIST, 'version.json'))) throw new Error('Compile primero: cd frontend && npm run build');

  // Configuración de Hosting tomada de firebase.json.
  const hosting = JSON.parse(readFileSync(join(RAIZ, 'firebase.json'), 'utf8')).hosting;
  const config = {
    cleanUrls: !!hosting.cleanUrls,
    rewrites: hosting.rewrites.map((r) => ({ glob: r.source, path: r.destination })),
    headers: hosting.headers.map((h) => ({
      ...(h.regex ? { regex: h.regex } : { glob: h.source }),
      headers: Object.fromEntries(h.headers.map((x) => [x.key, x.value])),
    })),
  };

  // Archivos comprimidos y su resumen SHA-256, como los pide la API.
  const recorrer = (d) => readdirSync(d).flatMap((f) => (statSync(join(d, f)).isDirectory() ? recorrer(join(d, f)) : [join(d, f)]));
  const archivos = new Map();
  for (const f of recorrer(DIST)) {
    const gz = gzipSync(readFileSync(f), { level: 9 });
    archivos.set('/' + relative(DIST, f).split(sep).join('/'), { gz, hash: createHash('sha256').update(gz).digest('hex') });
  }

  const version = pedir('POST', `${API}/sites/${SITIO}/versions`, { config });
  console.log(`Versión creada: ${version.name}`);
  const { uploadRequiredHashes = [], uploadUrl } = pedir('POST', `${API}/${version.name}:populateFiles`, {
    files: Object.fromEntries([...archivos].map(([ruta, a]) => [ruta, a.hash])),
  });
  const porHash = new Map([...archivos.values()].map((a) => [a.hash, a.gz]));
  for (const hash of uploadRequiredHashes) pedir('POST', `${uploadUrl}/${hash}`, porHash.get(hash), 'application/octet-stream');
  console.log(`Archivos: ${archivos.size} (${uploadRequiredHashes.length} subidos, el resto ya estaba en Firebase)`);

  pedir('PATCH', `${API}/${version.name}?update_mask=status`, { status: 'FINALIZED' });
  const commit = JSON.parse(readFileSync(join(DIST, 'version.json'), 'utf8')).commit ?? 'local';
  pedir('POST', `${API}/sites/${SITIO}/releases?versionName=${encodeURIComponent(version.name)}`, { message: `Publicado ${commit}` });
  console.log(`✔ Publicado en https://${SITIO}.web.app (${commit})`);
} catch (e) {
  console.error(`✖ ${e.message}`);
  process.exitCode = 1;
} finally {
  rmSync(temporal, { recursive: true, force: true });
}
