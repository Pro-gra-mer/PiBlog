import { Component, OnInit } from '@angular/core';
import { ArticleService } from '../../../services/article.service'; // Ajusta si cambia el path
import {
  NavigationEnd,
  Router,
  RouterLink,
  RouterModule,
} from '@angular/router';
import { CommonModule } from '@angular/common';
import { filter } from 'rxjs';
import { PiAuthService } from '../../../services/pi-auth.service';
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
    private piAuthService: PiAuthService
  ) {
    this.router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe(() => {
        this.checkRejectedArticles();
      });
  }

  ngOnInit(): void {
    this.checkRejectedArticles();
  }

  toggleSidebar() {
    this.sidebarOpen = !this.sidebarOpen;
  }

  checkRejectedArticles(): void {
    this.articleService.getUserRejectedArticles().subscribe({
      next: (articles) => {
        this.hasRejected = articles.length > 0;
      },
      error: () => {
        this.hasRejected = false;
      },
    });
  }

  handleCreateArticleClick(): void {
    if (this.piAuthService.isAdmin()) {
      // 🔓 Si es admin, puede ir directamente a redactar
      this.router.navigate(['/user-dashboard/create-article']);
    } else {
      // 🔐 Si no es admin, debe ir a pagar primero
      this.showInfoMessage = true;

      setTimeout(() => {
        this.router.navigate(['/advertise']);
      }, 3000);
    }
  }
}
