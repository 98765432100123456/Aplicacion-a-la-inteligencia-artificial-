// pdfmake 0.3 no publica tipos; se declara solo lo que usa el servicio de informes.
declare module 'pdfmake' {
  interface DocumentoGenerado {
    getBuffer(): Promise<Buffer>;
  }
  interface PdfMake {
    setFonts(fonts: Record<string, Record<string, string>>): void;
    setUrlAccessPolicy(callback: (url: string) => boolean): void;
    setLocalAccessPolicy(callback: (path: string) => boolean): void;
    createPdf(documento: Record<string, unknown>): DocumentoGenerado;
  }
  const pdfmake: PdfMake;
  export = pdfmake;
}
declare module 'pdfmake/fonts/Roboto' {
  const fonts: Record<string, Record<string, string>>;
  export = fonts;
}
