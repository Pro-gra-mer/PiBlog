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

    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        accessToken = user.accessToken;
      } catch (error) {
        console.error('Error al parsear user:', error);
      }
    }

    if (accessToken) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });
      return next.handle(authReq);
    }
    return next.handle(req);
  }
}
