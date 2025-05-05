import { Injectable } from '@angular/core';
import {
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest,
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.dev';

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
        if (!environment.production) {
          console.error('Error parsing user from localStorage:', error);
        }
      }
    }

    if (accessToken) {
      const headers = req.headers
        .set('Authorization', `Bearer ${accessToken}`)
        .set(
          'Content-Type',
          req.headers.get('Content-Type') || 'application/json'
        );

      const authReq = req.clone({ headers });

      if (!environment.production) {
        console.log('Request with Authorization header:', authReq);
      }

      return next.handle(authReq);
    } else {
      if (!environment.production) {
        console.log('Request without Authorization header:', req);
      }
    }

    return next.handle(req);
  }
}
