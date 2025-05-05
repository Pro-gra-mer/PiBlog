import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.dev';

@Component({
  selector: 'app-rejected',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './rejected.component.html',
  styleUrl: './rejected.component.css',
})
export class RejectedComponent implements OnInit {
  rejected: Article[] = [];
  loading = true;
  error = '';
  showDeleteModal = false;
  articleIdToDelete: number | null = null;

  constructor(private articleService: ArticleService, private router: Router) {}

  // Initializes component and loads rejected articles
  ngOnInit(): void {
    this.articleService.getUserRejectedArticles().subscribe({
      next: (articles) => {
        this.rejected = articles;
        this.loading = false;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load rejected articles');
        }
        this.error = 'Failed to load rejected articles.';
        this.loading = false;
      },
    });
  }

  // Navigates to edit article page
  editArticle(id: number): void {
    this.router.navigate(['/user-dashboard/edit-article', id]);
  }

  // Opens delete confirmation modal
  openDeleteModal(id: number): void {
    this.articleIdToDelete = id;
    this.showDeleteModal = true;
  }

  // Confirms and deletes an article
  confirmDelete(): void {
    if (this.articleIdToDelete !== null) {
      this.articleService
        .deleteArticleWithCleanup(this.articleIdToDelete)
        .subscribe({
          next: () => {
            this.rejected = this.rejected.filter(
              (a) => a.id !== this.articleIdToDelete
            );
            this.updateHasRejected();
            this.showDeleteModal = false;
            this.articleIdToDelete = null;
            this.error = 'Article deleted successfully.';
          },
          error: () => {
            if (!environment.production) {
              console.error('Failed to delete article');
            }
            this.error = 'Failed to delete article.';
            this.showDeleteModal = false;
          },
        });
    }
  }

  // Cancels delete action
  cancelDelete(): void {
    this.showDeleteModal = false;
    this.articleIdToDelete = null;
  }

  // Notifies parent component to update rejected articles status
  private updateHasRejected(): void {
    const userDashboard =
      this.router.routerState.snapshot.root.children[0].component;
    if (userDashboard && (userDashboard as any).checkRejectedArticles) {
      (userDashboard as any).checkRejectedArticles();
    }
  }
}
