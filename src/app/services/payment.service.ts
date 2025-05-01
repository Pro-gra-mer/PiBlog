import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { PiAuthService } from './pi-auth.service';
import { environment } from '../environments/environment.dev';
import { Observable, of, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class PaymentService {
  // Observable para notificar cuando se activa un plan
  planActivated$ = new Subject<{
    articleId: number;
    expirationAt: string;
    planType: string;
  }>();

  constructor(private http: HttpClient, private piAuthService: PiAuthService) {}

  // Activar un plan (MAIN_SLIDER o CATEGORY_SLIDER)
  activatePlan(
    articleId: number,
    planType: string,
    categorySlug: string | null
  ): Observable<any> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.accessToken || !user.username) {
      console.error('No se encontró un token o usuario válido');
      alert('You must be logged in with Pi to make payments.');
      this.piAuthService.forceReauthentication();

      // Retornar un observable vacío o de error
      return of(null); // Esto previene el error y termina el flujo sin hacer nada
    }

    // Continuar con el código normal si el token es válido
    const payload = {
      articleId,
      planType,
      username: user.username,
      categorySlug: categorySlug, // Solo si el plan es CATEGORY_SLIDER
    };

    return this.http.post(
      `${environment.apiUrl}/api/payments/activate`,
      payload,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        }),
      }
    );
  }

  // Obtener los slots disponibles para los planes (MAIN_SLIDER o CATEGORY_SLIDER)
  getSlotInfo(
    promoteType: string,
    categorySlug: string | null
  ): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/payments/slots`, {
      params: { promoteType, categorySlug: categorySlug || '' },
    });
  }
}
