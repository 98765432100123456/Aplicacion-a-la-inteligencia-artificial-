import { rutaDeRegreso } from './navegacion';

describe('rutaDeRegreso (redirección abierta)', () => {
  it('acepta rutas internas', () => {
    expect(rutaDeRegreso('/usuarios')).toBe('/usuarios');
    expect(rutaDeRegreso('/predios/abc?tab=1')).toBe('/predios/abc?tab=1');
  });

  it('descarta destinos externos y trucos conocidos', () => {
    for (const malo of [
      'https://otro.sitio',
      '//otro.sitio',
      '/\\otro.sitio',
      '/\\\\otro.sitio',
      'javascript:alert(1)',
      '/ruta\nSet-Cookie: x',
      '/' + 'a'.repeat(400),
      '',
      null,
    ]) {
      expect(rutaDeRegreso(malo)).withContext(String(malo)).toBe('/inicio');
    }
  });
});
