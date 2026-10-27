import { muestraMinima, tipoProductor } from '../../../compartido/norma';
import { FarmItem } from '../../models/predios';
import { DemoUser } from '../datos-demo';
import { estado, fallo, guardar, limpiar, ok, Peticion, prohibido, puede, Respuesta } from '../almacen-demo';
import { DemoFarm } from '../predios-demo';

/** Simula /species y /farms con las reglas de backend/src/farms (control de acceso por predio, RNF07). */

export const veTodos = (u: DemoUser) => puede(u, 'fincas.ver', 'fincas.gestionar');

/** Predios que el usuario puede ver: todos, o solo los registrados con su correo. */
export function prediosVisibles(u: DemoUser): DemoFarm[] | null {
  if (veTodos(u)) return estado.datos.farms;
  if (!puede(u, 'predios.propios')) return null;
  return estado.datos.farms.filter((f) => f.ownerEmail?.toLowerCase() === u.email.toLowerCase());
}

export function vistaPredio(f: DemoFarm): FarmItem {
  const species = f.species.map((s) => {
    const e = estado.datos.species.find((x) => x.id === s.speciesId)!;
    const total = s.calves + s.young + s.adults;
    return { ...s, code: e.code, name: e.name, total, producerType: tipoProductor(total), sampleSize: muestraMinima(total) };
  });
  const ultima = estado.datos.evaluations
    .filter((e) => e.farmId === f.id && e.status === 'FINALIZADA')
    .sort((a, b) => b.finishedAt!.localeCompare(a.finishedAt!))[0];
  const correo = f.ownerEmail?.toLowerCase();
  return {
    id: f.id, name: f.name,
    owner: { name: f.ownerName, document: f.ownerDocument, phone: f.ownerPhone, email: f.ownerEmail, hasAccount: !!correo && estado.datos.users.some((u) => u.email === correo) },
    department: f.department, municipality: f.municipality, vereda: f.vereda, address: f.address,
    latitude: f.latitude, longitude: f.longitude, areaHectares: f.areaHectares, productionSystem: f.productionSystem, notes: f.notes,
    species, totalAnimals: species.reduce((a, s) => a + s.total, 0),
    lastEvaluation: ultima
      ? { id: ultima.id, speciesName: estado.datos.species.find((s) => s.id === ultima.speciesId)!.name, finishedAt: ultima.finishedAt!, score: ultima.results!.puntaje, level: ultima.results!.nivel }
      : null,
    updatedAt: f.updatedAt,
  };
}

/** Valida y copia los campos del formulario; devuelve un mensaje si algo no cumple. */
function aplicar(f: DemoFarm, c: Record<string, unknown>): string | null {
  for (const k of ['name', 'ownerName', 'ownerPhone', 'department', 'municipality'] as const) {
    if (c[k] !== undefined) {
      if (!limpiar(c[k])) return 'Complete los datos obligatorios del predio.';
      f[k] = limpiar(c[k]);
    }
  }
  for (const k of ['ownerDocument', 'vereda', 'address', 'productionSystem', 'notes'] as const) {
    if (c[k] !== undefined) f[k] = limpiar(c[k]) || null;
  }
  if (c['ownerEmail'] !== undefined) f.ownerEmail = limpiar(c['ownerEmail']).toLowerCase() || null;
  for (const k of ['latitude', 'longitude', 'areaHectares'] as const) {
    if (c[k] !== undefined) f[k] = c[k] === null || c[k] === '' ? null : Number(c[k]);
  }
  const especies = c['species'] as DemoFarm['species'] | undefined;
  if (especies) {
    if (!especies.length) return 'Registre al menos una especie con su inventario.';
    if (new Set(especies.map((s) => s.speciesId)).size !== especies.length) return 'Cada especie se registra una sola vez por predio.';
    if (especies.some((s) => s.calves + s.young + s.adults === 0)) return 'Cada especie debe tener al menos un animal en el inventario.';
    f.species = especies.map(({ speciesId, calves, young, adults }) => ({ speciesId, calves, young, adults }));
  }
  f.updatedAt = new Date().toISOString();
  return null;
}

export function rutasDePredios({ req, metodo, ruta, cuerpo }: Peticion, yo: DemoUser): Respuesta {
  if (ruta === '/species' && metodo === 'GET') return ok(estado.datos.species);
  if (ruta === '/farms' && metodo === 'GET') {
    const visibles = prediosVisibles(yo);
    if (!visibles) return prohibido();
    const q = (req.params.get('search') ?? '').trim().toLowerCase();
    const lista = visibles
      .filter((f) => !q || [f.name, f.ownerName, f.municipality].some((v) => v.toLowerCase().includes(q)))
      .sort((a, b) => a.name.localeCompare(b.name, 'es'));
    return ok(lista.map(vistaPredio));
  }
  if (ruta === '/farms' && metodo === 'POST') {
    if (!puede(yo, 'fincas.gestionar')) return prohibido();
    const f = { id: `p-${Date.now()}`, species: [] as DemoFarm['species'] } as unknown as DemoFarm;
    const error = aplicar(f, { ownerDocument: null, vereda: null, address: null, productionSystem: null, notes: null, ownerEmail: null, latitude: null, longitude: null, areaHectares: null, ...cuerpo, species: cuerpo['species'] ?? [] });
    if (error || !f.name) return fallo(400, [error ?? 'Complete los datos obligatorios del predio.']);
    estado.datos.farms.push(f);
    guardar();
    return ok(vistaPredio(f), 201);
  }
  const coincide = ruta.match(/^\/farms\/([^/]+)$/);
  if (!coincide) return null;
  const visibles = prediosVisibles(yo);
  if (!visibles) return prohibido();
  const f = visibles.find((x) => x.id === coincide[1]);
  if (!f) return fallo(404, 'El predio no existe.');
  if (metodo === 'GET') return ok(vistaPredio(f));
  if (metodo === 'PATCH') {
    if (!puede(yo, 'fincas.gestionar')) return prohibido();
    const copia = structuredClone(f);
    const error = aplicar(copia, cuerpo);
    if (error) return fallo(400, [error]);
    Object.assign(f, copia);
    guardar();
    return ok(vistaPredio(f));
  }
  return null;
}
