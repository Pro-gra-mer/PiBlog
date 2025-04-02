import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';

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

  ngOnInit(): void {
    this.articleService.getUserRejectedArticles().subscribe({
      next: (articles) => {
        this.rejected = articles;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error loading rejected articles';
        this.loading = false;
      },
    });
  }

  editArticle(id: number): void {
    this.router.navigate(['/user-dashboard/edit-article', id]);
  }

  openDeleteModal(id: number): void {
    this.articleIdToDelete = id;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    if (this.articleIdToDelete !== null) {
      this.articleService
        .deleteArticleWithCleanup(this.articleIdToDelete)
        .subscribe({
          next: () => {
            // Remove the article from the list immediately
            this.rejected = this.rejected.filter(
              (a) => a.id !== this.articleIdToDelete
            );

            // Update the 'hasRejected' status in the parent component
            this.updateHasRejected();

            this.showDeleteModal = false;
            this.articleIdToDelete = null;
          },
          error: (err) => {
            console.error('Error deleting article:', err);
            this.error = 'No se pudo eliminar el artículo.';
            this.showDeleteModal = false;
          },
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.articleIdToDelete = null;
  }

  // Method to notify the parent component to update the 'hasRejected' status
  private updateHasRejected(): void {
    // Notify the parent (UserDashboardComponent) to update hasRejected
    const userDashboard =
      this.router.routerState.snapshot.root.children[0].component;
    if (userDashboard && (userDashboard as any).checkRejectedArticles) {
      (userDashboard as any).checkRejectedArticles();
    }
  }
}
