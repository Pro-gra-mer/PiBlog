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
import { environment } from '../environments/environment.dev';
import { PromoteType } from '../models/PromoteType';

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
          } else if (!environment.production) {
            console.error('Failed to initialize Pi SDK');
          }
        });
      }
    }
  }

  // Initializes Pi SDK
  private initializePiSDK(): void {
    Pi.init({ version: '2.0', sandbox: true });
  }

  // Authenticates user with Pi SDK
  loginWithPi(afterAuthCallback?: (accessToken: string) => void): void {
    if (typeof Pi === 'undefined') {
      if (!environment.production) {
        console.error('Failed to initialize Pi SDK');
      }
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
              if (!environment.production) {
                console.error(
                  'Authentication failed: No access token received'
                );
              }
              return;
            }

            const username = auth.user?.username || 'Sandbox Pi User';
            const piId = auth.user?.uid || 'sandbox-user';

            this.http
              .post(`${environment.apiUrl}/auth/pi-login`, {
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

                    // ✅ Llamar al callback si fue proporcionado (modo QR)
                    if (afterAuthCallback) {
                      setTimeout(() => {
                        afterAuthCallback(auth.accessToken);
                      }, 0);
                      return;
                    }

                    // 🔁 Redirección normal si no hay callback
                    this.getActivePlan().subscribe((planType) => {
                      const hasPlan = planType !== PromoteType.STANDARD;

                      if (response.role === 'ADMIN') {
                        this.router.navigate(['/admin-dashboard']);
                      } else if (hasPlan) {
                        this.router.navigate(['/user-dashboard']);
                      } else {
                        this.router.navigate(['/']);
                      }
                    });
                  }
                },
                error: () => {
                  if (!environment.production) {
                    console.error('Failed to authenticate with backend');
                  }
                  this.router.navigate(['/user-dashboard']);
                },
              });
          });
        }
      )
      .catch(() => {
        if (!environment.production) {
          console.error('Failed to authenticate with Pi SDK');
        }
      });
  }

  // Logs out the user
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

  // Checks authentication status
  private checkAuthStatus(): boolean {
    return isPlatformBrowser(this.platformId)
      ? localStorage.getItem('user') !== null
      : false;
  }

  // Retrieves username from local storage
  getUsername(): string | null {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser).username || null;
        } catch {
          if (!environment.production) {
            console.error('Failed to parse user data');
          }
          return null;
        }
      }
    }
    return null;
  }

  // Checks if user is admin
  isAdmin(): boolean {
    if (isPlatformBrowser(this.platformId)) {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        try {
          return JSON.parse(storedUser).role === 'ADMIN';
        } catch {
          if (!environment.production) {
            console.error('Failed to parse user data');
          }
          return false;
        }
      }
    }
    return false;
  }

  // Retrieves user's active plan
  getActivePlan(): Observable<PromoteType> {
    const storedUser = localStorage.getItem('user');
    if (!storedUser) return of(PromoteType.STANDARD);

    try {
      const { username } = JSON.parse(storedUser);
      return this.http
        .get<any>(
          `${environment.apiUrl}/api/payments/active-plan?username=${username}`
        )
        .pipe(
          map((response) => {
            const plan = response.planType;
            return Object.values(PromoteType).includes(plan)
              ? (plan as PromoteType)
              : PromoteType.STANDARD;
          })
        );
    } catch {
      if (!environment.production) {
        console.error('Failed to parse user data');
      }
      return of(PromoteType.STANDARD);
    }
  }

  // Forces reauthentication with Pi SDK
  forceReauthentication(): void {
    if (isPlatformBrowser(this.platformId)) {
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      this.isAuthenticatedSubject.next(false);
      this.usernameSubject.next(null);
      this.ngZone.run(() => {
        this.loginWithPi();
      });
    }
  }
}
