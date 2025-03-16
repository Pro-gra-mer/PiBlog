import {
  Injectable,
  ApplicationRef,
  Inject,
  PLATFORM_ID,
  NgZone,
} from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject } from 'rxjs';
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

            // Imprimir el access token para pruebas
            console.log('Access Token:', auth.accessToken);

            const username = auth.user?.username || 'Sandbox Pi User';

            this.http
              .post('http://localhost:8080/auth/pi-login', {
                accessToken: auth.accessToken,
                piId: auth.user?.uid || '',
                username,
              })
              .subscribe({
                next: (response: any) => {
                  if (isPlatformBrowser(this.platformId)) {
                    localStorage.setItem('user', JSON.stringify(response));
                    this.isAuthenticatedSubject.next(true);
                    this.usernameSubject.next(response.username);
                  }
                  this.appRef.tick();
                  const dashboard =
                    response.role === 'ADMIN'
                      ? '/admin-dashboard'
                      : '/user-dashboard';
                  this.router.navigate([dashboard]);
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
}
