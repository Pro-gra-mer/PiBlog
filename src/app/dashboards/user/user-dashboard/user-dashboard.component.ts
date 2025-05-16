import { Component, Inject, OnInit, PLATFORM_ID } from '@angular/core';
import { ArticleService } from '../../../services/article.service';
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterModule,
} from '@angular/router';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { filter } from 'rxjs';
import { PiAuthService } from '../../../services/pi-auth.service';
import { environment } from '../../../environments/environment.dev';

@Component({
  selector: 'app-user-dashboard',
  standalone: true,
  imports: [RouterLink, RouterModule, CommonModule],
  templateUrl: './user-dashboard.component.html',
  styleUrls: ['./user-dashboard.component.css'],
})
export class UserDashboardComponent implements OnInit {
  sidebarOpen = false;
  hasRejected = false;
  infoMessage: string | null = null;
  showInfoMessage = false;

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private piAuthService: PiAuthService,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkRejectedArticles();
      });
  }

  // Initializes component and checks for rejected articles
  ngOnInit(): void {
    this.checkRejectedArticles();
  }

  // Toggles sidebar visibility
  toggleSidebar(): void {
    this.sidebarOpen = !this.sidebarOpen;
  }

  // Checks if user has rejected articles
  checkRejectedArticles(): void {
    if (!isPlatformBrowser(this.platformId)) return;

    const user = localStorage.getItem('user');
    if (!user) return;

    this.articleService.getUserRejectedArticles().subscribe({
      next: (articles) => {
        this.hasRejected = articles.length > 0;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to check rejected articles');
        }
        this.hasRejected = false;
      },
    });
  }

  // Handles navigation to create article or advertise page
  handleCreateArticleClick(): void {
    if (this.piAuthService.isAdmin()) {
      this.router.navigate(['/user-dashboard/create-article']);
    } else {
      this.infoMessage =
        'You need to subscribe to create an article. Redirecting to subscription page...';
      this.showInfoMessage = true;
      setTimeout(() => {
        this.showInfoMessage = false;
        this.infoMessage = null;
        this.router.navigate(['/advertise']);
      }, 3000);
    }
  }

  closeSidebar(): void {
    if (window.innerWidth < 1024) {
      this.sidebarOpen = false;
    }
  }
}
