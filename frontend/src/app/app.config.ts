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
import { provideRouter, withComponentInputBinding, withInMemoryScrolling, withNavigationErrorHandler } from '@angular/router';
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
    ),
    // En modo demostración, demoApiInterceptor responde en lugar del servidor.
    provideHttpClient(withInterceptors([authInterceptor, demoApiInterceptor])),
    { provide: LOCALE_ID, useValue: 'es-CO' },
    { provide: ErrorHandler, useClass: ManejadorErrores },
  ],
};
