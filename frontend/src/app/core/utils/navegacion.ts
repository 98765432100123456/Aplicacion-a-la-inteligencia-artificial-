/**
 * Devuelve la ruta interna a la que se regresa después de ingresar. Descarta direcciones externas
 * y trucos de redirección abierta: `//otro.sitio`, `/\\otro.sitio` (los navegadores leen la barra
 * invertida como `/`), esquemas como `javascript:` y caracteres de control.
 */
export function rutaDeRegreso(volver: string | null, porDefecto = '/inicio'): string {
  if (!volver || volver.length > 300) return porDefecto;
  const interna = volver.startsWith('/') && !/^\/[\/\\]/.test(volver) && !/[\\\u0000-\u001f\u007f]/.test(volver);
  return interna ? volver : porDefecto;
}
