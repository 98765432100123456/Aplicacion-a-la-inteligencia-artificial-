import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../services/auth.service';

/** Agrega el token a las llamadas a la API y cierra la sesión si el servidor lo rechaza. */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.accessToken;
  const isApi = req.url.startsWith(environment.apiUrl);
  const isLogin = req.url.endsWith('/auth/login');

  const request = token && isApi ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;
  return next(request).pipe(
    catchError((error: unknown) => {
      if (error instanceof HttpErrorResponse && error.status === 401 && token && isApi && !isLogin) {
        auth.logout('expired');
      }
      return throwError(() => error);
    }),
  );
};
