import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { esVersionVieja } from '../utils/manejador-errores';
import { ActualizacionService } from './actualizacion.service';

describe('ActualizacionService', () => {
  function servicio(versiones: (string | null)[]) {
    spyOn(window, 'fetch').and.callFake(async () => {
      const v = versiones.shift();
      return v === null ? new Response('', { status: 404 }) : new Response(JSON.stringify({ version: v }));
    });
    TestBed.configureTestingModule({ providers: [provideZonelessChangeDetection()] });
    return TestBed.inject(ActualizacionService);
  }

  it('avisa solo cuando la versión publicada cambia', async () => {
    const s = servicio(['a', 'a', 'b']);
    await s.revisar();
    await s.revisar();
    expect(s.disponible()).toBeFalse();
    await s.revisar();
    expect(s.disponible()).toBeTrue();
  });

  it('sin version.json (desarrollo) no avisa nada', async () => {
    const s = servicio([null, null]);
    await s.revisar();
    await s.revisar();
    expect(s.disponible()).toBeFalse();
  });

  it('reconoce los errores de archivos de una versión anterior', () => {
    expect(esVersionVieja(new TypeError('Failed to fetch dynamically imported module: /chunk-ABC.js'))).toBeTrue();
    expect(esVersionVieja(new Error('otra cosa'))).toBeFalse();
  });
});
