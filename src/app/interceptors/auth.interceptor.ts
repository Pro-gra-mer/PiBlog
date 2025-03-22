import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  intercept(
    req: HttpRequest<any>,
    next: HttpHandler
  ): Observable<HttpEvent<any>> {
    const storedUser = localStorage.getItem('user');
    let accessToken: string | null = null;

    // Verificar si hay un usuario almacenado
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        accessToken = user.accessToken;
        console.log('Token encontrado en localStorage:', accessToken); // Depuración
      } catch (error) {
        console.error('Error al parsear user desde localStorage:', error);
      }
    } else {
      console.log('No se encontró usuario en localStorage');
    }

    if (accessToken) {
      // Clonar la solicitud y añadir solo el encabezado Authorization si no hay Content-Type definido
      const headers = req.headers
        .set('Authorization', `Bearer ${accessToken}`)
        .set(
          'Content-Type',
          req.headers.get('Content-Type') || 'application/json'
        );

      const authReq = req.clone({ headers });
      console.log('Solicitud con Authorization:', authReq); // Depuración
      return next.handle(authReq);
    } else {
      console.log('Solicitud sin Authorization:', req); // Depuración
    }

    return next.handle(req);
  }
}
