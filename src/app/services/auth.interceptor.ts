import { HttpEvent, HttpHandlerFn, HttpRequest } from '@angular/common/http';
import { inject, EventEmitter, Output } from '@angular/core';
import { Router } from '@angular/router';
import { ToastrService } from 'ngx-toastr';
import { Observable, catchError, throwError, switchMap, from } from 'rxjs';
import { AppComponent } from '../app.component';
import { AuthService } from './auth.service';

export function jwtInterceptor(req: HttpRequest<unknown>, next: HttpHandlerFn): Observable<HttpEvent<unknown>> {
  
  console.log("Dentro del interceptador");

  const authService = inject(AuthService);
  const router = inject(Router);
  const toastr = inject(ToastrService);

  if (req.url.includes('auth/refresh')) {
    return next(req);
  }

  const token = localStorage.getItem('access_token');

  if(authService.tokenExpired() && localStorage.getItem('refresh_token')) {
    return from(authService.refreshToken()).pipe(
      switchMap(()=>{
        const newToken = localStorage.getItem('access_token');
        const clonedReq = req.clone({
          setHeaders: {Authorization:`Bearer ${newToken}`}
      });
      return next(clonedReq);
    }),
    catchError((error) => {
      authService.logout();
      router.navigate(['/login']);
      toastr.error('Sessió expirada. Torna a iniciar sessió.');
      return throwError(() => error);
    })
  )};

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error) => {
      if (error.status === 401) {
        localStorage.removeItem('access_token'); // Neteja token si no és vàlid
        toastr.error(
          'Su sesión ha expirado. Por favor, inicie sesión nuevamente.',
          'Sesión Expirada',
        );
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
}
