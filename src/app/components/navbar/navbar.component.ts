import { CommonModule, isPlatformBrowser } from '@angular/common';
import {
  ChangeDetectorRef,
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
} from '@angular/core';
import { Router, RouterLink, NavigationEnd } from '@angular/router';
import { PiAuthService } from '../../services/pi-auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, CommonModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css'],
})
export class NavbarComponent implements OnInit {
  isMenuOpen = false;
  isAuthenticated = false;
  role: string | null = null;
  username: string | null = null;
  dashboardRoute: string = '/user-dashboard'; // Propiedad para la ruta

  categories: string[] = [
    'Marketplaces',
    'Games',
    'Productivity Tools',
    'Education',
    'Social & Community',
    'Digital Services',
    'Travel & Experiences',
  ];

  showCategories = false;

  constructor(
    public piAuthService: PiAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.piAuthService.isAuthenticated$.subscribe((authStatus) => {
      this.isAuthenticated = authStatus;
      this.updateUserInfo();
      this.cdr.detectChanges();
    });

    this.piAuthService.username$.subscribe((username) => {
      this.username = username;
      this.updateUserInfo();
      this.cdr.detectChanges();
    });

    if (isPlatformBrowser(this.platformId) && localStorage.getItem('user')) {
      this.updateUserInfo();
    }

    // Suscribirse a los eventos del router para cerrar el menú móvil en cada navegación.
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isMenuOpen = false;
        this.cdr.detectChanges();
      }
    });
  }

  private updateUserInfo(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('user');
      console.log('Raw localStorage user:', userJson);
      const user = JSON.parse(userJson || '{}');
      this.username = user.username || null;
      this.role = user.role || null;
      this.dashboardRoute =
        this.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard'; // Actualizar ruta
      console.log('User info actualizada:', {
        username: this.username,
        role: this.role,
        dashboardRoute: this.dashboardRoute,
      });
    } else {
      this.username = null;
      this.role = null;
      this.dashboardRoute = '/user-dashboard'; // Valor por defecto
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  loginWithPi(): void {
    console.log('Se hizo click en Sign in');
    this.piAuthService.loginWithPi();
  }

  // Mantener por si necesitas usarlo en otro contexto
  getDashboardRoute(): string {
    console.log('getDashboardRoute llamado, role actual:', this.role);
    return this.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard';
  }

  logout(): void {
    this.piAuthService.logout();
  }

  toggleCategories(): void {
    this.showCategories = !this.showCategories;
  }
}
