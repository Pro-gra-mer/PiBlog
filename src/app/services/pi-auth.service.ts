import {
  Injectable,
  ApplicationRef,
  Inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, map, Observable, of } from 'rxjs';
import { isPlatformBrowser } from '@angular/common';

declare let Pi: any;

@Injectable({
  providedIn: 'root',
})
export class PiAuthService {
  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  private isAdminSubject = new BehaviorSubject<boolean>(false);
  isAdmin$ = this.isAdminSubject.asObservable();

  private usernameSubject = new BehaviorSubject<string | null>(null);
  username$ = this.usernameSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router,
    private appRef: ApplicationRef,
    @Inject(PLATFORM_ID) private platformId: any,
    private ngZone: NgZone
  ) {
    if (isPlatformBrowser(this.platformId)) {
      this.isAuthenticatedSubject.next(this.checkAuthStatus());
      this.usernameSubject.next(this.getUsername());

      if (typeof Pi !== 'undefined') {
        this.initializePiSDK();
      } else {
        window.addEventListener('load', () => {
          if (typeof Pi !== 'undefined') {
            this.initializePiSDK();
          } else {
            console.error('Pi SDK no está disponible');
          }
        });
      }
    }
  }

  private initializePiSDK(): void {
    Pi.init({ version: '2.0', sandbox: true });
  }

  loginWithPi(): void {
    if (typeof Pi === 'undefined') {
      console.error('Pi SDK no está disponible.');
      return;
    }

    Pi.authenticate(['username', 'payments'])
      .then(
        (auth: {
          accessToken: string;
          user?: { username: string; uid: string };
        }) => {
          this.ngZone.run(() => {
            if (!auth || !auth.accessToken) {
              console.error(
                'Autenticación fallida: no se recibió accessToken',
                auth
              );
              return;
            }

            const username = auth.user?.username || 'Sandbox Pi User';
            const piId = auth.user?.uid || 'sandbox-user';

            this.http
              .post('http://localhost:8080/auth/pi-login', {
                accessToken: auth.accessToken,
                piId,
                username,
              })
              .subscribe({
                next: (response: any) => {
                  if (isPlatformBrowser(this.platformId)) {
                    const userData = {
                      accessToken: auth.accessToken,
                      username,
                      piId,
                      role: response.role || 'USER',
                    };
                    localStorage.setItem('user', JSON.stringify(userData));
                    this.isAuthenticatedSubject.next(true);
                    this.usernameSubject.next(username);

                    this.appRef.tick();

                    // 👇 Consultar si tiene plan activo antes de redirigir
                    this.getActivePlan().subscribe((planType) => {
                      const hasPlan = planType !== 'NONE';

                      if (response.role === 'ADMIN') {
                        this.router.navigate(['/admin-dashboard']);
                      } else if (hasPlan) {
                        this.router.navigate(['/user-dashboard']);
                      } else {
                        this.router.navigate(['/']); // 👈 sin plan, redirige al home
                      }
                    });
                  }
                },

                error: (err) => {
                  console.error('Error en el backend:', err);
                  this.router.navigate(['/user-dashboard']);
                },
              });
          });
        }
      )
      .catch((error: any) => {
        console.error('Error en Pi.authenticate:', error);
      });
  }

  logout(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
    this.ngZone.run(() => {
      this.isAuthenticatedSubject.next(false);
      this.usernameSubject.next(null);
      this.appRef.tick();
      this.router.navigate(['/']);
    });
  }

  private checkAuthStatus(): boolean {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem('user') !== null
      : false;
  }

  getUsername(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser).username : null;
    }
    return null;
  }

  isAdmin(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      return storedUser ? JSON.parse(storedUser).role === 'ADMIN' : false;
    }
    return false;
  }

  getActivePlan(): Observable<string> {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return of('NONE');

    const { username } = JSON.parse(storedUser);
    return this.http
      .get<any>(
        `http://localhost:8080/api/payments/active-plan?username=${username}`
      )
      .pipe(map((response) => response.planType || 'NONE'));
  }
}
