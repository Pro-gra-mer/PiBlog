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
  // Observable to notify when a plan is activated
  planActivated$ = new Subject<{
    articleId: number;
    expirationAt: string;
    planType: string;
  }>();

  constructor(private http: HttpClient, private piAuthService: PiAuthService) {}

  // Activate a plan (MAIN_SLIDER or CATEGORY_SLIDER)
  activatePlan(
    articleId: number,
    planType: string,
    categorySlug: string | null
  ): Observable<any> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    if (!user.accessToken || !user.username) {
      console.error('No valid token or user found');
      alert('You must be logged in with Pi to make payments.');
      this.piAuthService.forceReauthentication();

      return of(null); // Prevents the error and ends the flow without doing anything
    }

    // Continue with normal flow if token is valid
    const payload = {
      articleId,
      planType,
      username: user.username,
      categorySlug: categorySlug,
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

  // Get available slots for plans (MAIN_SLIDER or CATEGORY_SLIDER)
  getSlotInfo(
    promoteType: string,
    categorySlug: string | null
  ): Observable<any> {
    return this.http.get(`${environment.apiUrl}/api/payments/slots`, {
      params: { promoteType, categorySlug: categorySlug || '' },
    });
  }

  // Activate a plan as an admin (MAIN_SLIDER or CATEGORY_SLIDER)
  activatePlanAsAdmin(
    articleId: number,
    planType: string,
    categorySlug: string | null
  ): Observable<any> {
    const user = JSON.parse(localStorage.getItem('user') || '{}');

    const payload = {
      articleId,
      planType,
      username: user.username,
      categorySlug,
    };

    return this.http.post(
      `${environment.apiUrl}/api/payments/activate/admin`,
      payload,
      {
        headers: new HttpHeaders({
          Authorization: `Bearer ${user.accessToken}`,
          'Content-Type': 'application/json',
        }),
      }
    );
  }
}
