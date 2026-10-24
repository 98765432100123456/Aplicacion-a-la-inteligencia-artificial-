/** Devuelve la ruta interna a la que se regresa después de ingresar; descarta direcciones externas. */
export function rutaDeRegreso(volver: string | null, porDefecto = '/inicio'): string {
  return volver?.startsWith('/') && !volver.startsWith('//') ? volver : porDefecto;
}
