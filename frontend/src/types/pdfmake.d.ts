/** Tipos mínimos de pdfmake para generar los informes en el modo demostración. */
declare module 'pdfmake/build/pdfmake' {
  const pdfMake: {
    addVirtualFileSystem(vfs: Record<string, string>): void;
    createPdf(doc: Record<string, unknown>): { getBlob(): Promise<Blob> };
  };
  export default pdfMake;
}

declare module 'pdfmake/build/vfs_fonts' {
  const vfs: Record<string, string>;
  export default vfs;
}
