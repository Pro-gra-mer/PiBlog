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

  constructor(private articleService: ArticleService, private router: Router) {
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
}
