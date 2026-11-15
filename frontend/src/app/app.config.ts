import { registerLocaleData } from '@angular/common';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import localeEsCo from '@angular/common/locales/es-CO';
import {
  ApplicationConfig,
  ErrorHandler,
  LOCALE_ID,
  provideBrowserGlobalErrorListeners,
  provideZonelessChangeDetection,
} from '@angular/core';
import { provideRouter, withComponentInputBinding, withHashLocation, withInMemoryScrolling, withNavigationErrorHandler } from '@angular/router';
import { environment } from '../environments/environment';
import { routes } from './app.routes';
import { authInterceptor } from './core/interceptors/auth.interceptor';
import { demoApiInterceptor } from './core/demo/demo-api.interceptor';
import { esVersionVieja, ManejadorErrores, recargaPermitida } from './core/utils/manejador-errores';

registerLocaleData(localeEsCo);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(
      routes,
      withComponentInputBinding(),
      withInMemoryScrolling({ scrollPositionRestoration: 'top' }),
      // Tras publicar una versión, las pantallas de la anterior ya no están en el servidor:
      // se recarga directamente la página pedida, que trae la versión nueva.
      withNavigationErrorHandler((e) => {
        if (esVersionVieja(e.error) && recargaPermitida()) location.assign(e.url);
      }),
      // La vista previa publicada en claude.ai no controla la ruta del servidor: usa #/ruta.
      ...((environment as { vista?: boolean }).vista ? [withHashLocation()] : []),
    ),
    // En modo demostración, demoApiInterceptor responde en lugar del servidor.
    provideHttpClient(withInterceptors([authInterceptor, demoApiInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: ErrorHandler, useClass: ManejadorErrores },
  ],
};
