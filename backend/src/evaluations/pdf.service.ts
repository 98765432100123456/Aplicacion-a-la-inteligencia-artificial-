import { Injectable } from '@nestjs/common';
import { dirname } from 'node:path';
import pdfmake = require('pdfmake');
import roboto = require('pdfmake/fonts/Roboto');
import { DocumentoPdf } from '../compartido/informes';

/** Convierte las plantillas de compartido/informes.ts en PDF. */
@Injectable()
export class PdfService {
  constructor() {
    const carpetaFuentes = dirname(roboto['Roboto']['normal']);
    pdfmake.setFonts(roboto);
    // Los informes no cargan recursos externos ni archivos fuera de las fuentes.
    pdfmake.setUrlAccessPolicy(() => false);
    pdfmake.setLocalAccessPolicy((ruta) => ruta.startsWith(carpetaFuentes));
  }

  render(documento: DocumentoPdf): Promise<Buffer> {
    return pdfmake.createPdf(documento).getBuffer();
  }
}
