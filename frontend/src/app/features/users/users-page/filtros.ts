import { ParamMap } from '@angular/router';

export const TAMANO_PAGINA = 20;

export interface Filtros {
  search: string;
  roleId: string;
  active: string;
}

/** Los filtros viven en la dirección de la página para poder compartirlos o recargar sin perderlos. */
export function filtrosDesdeUrl(params: ParamMap): { filtros: Filtros; pagina: number } {
  return {
    filtros: { search: params.get('buscar') ?? '', roleId: params.get('rol') ?? '', active: params.get('estado') ?? '' },
    pagina: Number(params.get('pagina')) || 1,
  };
}

export function filtrosAUrl(f: Filtros, pagina: number) {
  return { buscar: f.search || null, rol: f.roleId || null, estado: f.active || null, pagina: pagina > 1 ? pagina : null };
}

/** Texto "21–40 de 57" para la paginación. */
export function textoDeRango(pagina: number, total: number): string {
  if (!total) return '';
  const desde = (pagina - 1) * TAMANO_PAGINA + 1;
  return `${desde}–${Math.min(pagina * TAMANO_PAGINA, total)} de ${total}`;
}
