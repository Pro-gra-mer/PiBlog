import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';
import { PiAuthService } from '../../../services/pi-auth.service';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../environments/environment.dev';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css',
})
export class PendingComponent implements OnInit {
  pendingArticles: Article[] = [];
  loading = true;
  error = '';
  isAdmin: boolean = false;
  showDeleteModal = false;
  showRejectModal = false;
  articleIdToDelete: number | null = null;
  articleIdToReject: number | null = null;
  rejectionReason: string = '';
  successMessage: string | null = null;

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private authService: PiAuthService
  ) {}

  // Initializes component and checks admin status
  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.fetchPendingArticles();
  }

  // Fetches pending articles from service
  fetchPendingArticles(): void {
    this.articleService.getPendingArticles().subscribe({
      next: (articles) => {
        this.pendingArticles = articles;
        this.loading = false;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load pending articles');
        }
        this.error = 'Failed to load pending articles.';
        this.loading = false;
      },
    });
  }

  // Approves and publishes an article
  publishArticle(articleId: number): void {
    this.articleService.approveArticle(articleId).subscribe({
      next: () => {
        this.pendingArticles = this.pendingArticles.filter(
          (a) => a.id !== articleId
        );
        this.error = 'Article published successfully.';
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to publish article');
        }
        this.error = 'Failed to publish article.';
      },
    });
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
            this.pendingArticles = this.pendingArticles.filter(
              (a) => a.id !== this.articleIdToDelete
            );
            this.showDeleteModal = false;
            this.articleIdToDelete = null;
            this.successMessage = 'Article deleted successfully.';
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

  // Opens reject confirmation modal
  openRejectModal(id: number): void {
    this.articleIdToReject = id;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

  // Confirms and rejects an article with a reason
  confirmReject(): void {
    if (this.articleIdToReject !== null && this.rejectionReason.trim()) {
      this.articleService
        .rejectArticle(this.articleIdToReject, this.rejectionReason)
        .subscribe({
          next: () => {
            this.pendingArticles = this.pendingArticles.filter(
              (a) => a.id !== this.articleIdToReject
            );
            this.showRejectModal = false;
            this.articleIdToReject = null;
            this.rejectionReason = '';
            this.error = 'Article rejected successfully.';
          },
          error: () => {
            if (!environment.production) {
              console.error('Failed to reject article');
            }
            this.error = 'Failed to reject article.';
            this.showRejectModal = false;
          },
        });
    }
  }

  // Cancels reject action
  cancelReject(): void {
    this.showRejectModal = false;
    this.articleIdToReject = null;
    this.rejectionReason = '';
  }
}
