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
import { CategoryService } from '../../services/category.service';
import { PromoteType } from '../../models/PromoteType';
import { environment } from '../../environments/environment.dev';
import { Category } from '../../models/Category.model';

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
  dashboardRoute: string = '/user-dashboard';
  categories: Category[] = [];
  showCategories = false;
  hasActivePlan: boolean = false;

  constructor(
    public piAuthService: PiAuthService,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private categoryService: CategoryService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {}

  ngOnInit(): void {
    this.piAuthService.isAuthenticated$.subscribe((authStatus) => {
      this.isAuthenticated = authStatus;
      this.updateUserInfo();
      this.loadCategories();
      this.checkPlan();
      this.cdr.detectChanges();
    });

    this.piAuthService.username$.subscribe((username) => {
      this.username = username;
      this.updateUserInfo();
      this.checkPlan();
      this.cdr.detectChanges();
    });

    if (isPlatformBrowser(this.platformId) && localStorage.getItem('user')) {
      this.updateUserInfo();
      this.checkPlan();
    }

    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        this.isMenuOpen = false;
        this.checkPlan();
        this.cdr.detectChanges();
      }
    });
  }

  private updateUserInfo(): void {
    if (isPlatformBrowser(this.platformId)) {
      const userJson = localStorage.getItem('user');
      if (!environment.production) {
        console.log('Retrieved user from localStorage');
      }
      const user = JSON.parse(userJson || '{}');
      this.username = user.username || null;
      this.role = user.role || null;
      this.dashboardRoute =
        this.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard';
      if (!environment.production) {
        console.log('User info updated', {
          username: this.username,
          role: this.role,
        });
      }
    } else {
      this.username = null;
      this.role = null;
      this.dashboardRoute = '/user-dashboard';
    }
  }

  toggleMenu(): void {
    this.isMenuOpen = !this.isMenuOpen;
  }

  loginWithPi(): void {
    const isPiBrowser = navigator.userAgent.includes('PiBrowser');
    if (isPiBrowser) {
      this.piAuthService.loginWithPi();
    } else {
      this.router.navigate(['/session-qr']);
    }
  }

  getDashboardRoute(): string {
    if (!environment.production) {
      console.log('Getting dashboard route', { role: this.role });
    }
    return this.role === 'ADMIN' ? '/admin-dashboard' : '/user-dashboard';
  }

  logout(): void {
    this.piAuthService.logout();
  }

  toggleCategories(): void {
    this.showCategories = !this.showCategories;
  }

  loadCategories(): void {
    this.categoryService.getAllCategories().subscribe({
      next: (data) => {
        this.categories = data;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load categories');
        }
      },
    });
  }

  closeMenu() {
    this.isMenuOpen = false;
    this.showCategories = false;
  }

  checkPlan(): void {
    if (!this.isAuthenticated) {
      this.hasActivePlan = false;
      return;
    }

    this.piAuthService.getActivePlan().subscribe((planType) => {
      this.hasActivePlan =
        planType === PromoteType.CATEGORY_SLIDER ||
        planType === PromoteType.MAIN_SLIDER ||
        planType === PromoteType.STANDARD;
      this.cdr.detectChanges();
    });
  }
}
