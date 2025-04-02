import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';
import { PiAuthService } from '../../../services/pi-auth.service';
import { FormsModule } from '@angular/forms'; // ✅ Asegúrate de importar esto si usas ngModel

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

  constructor(
    private articleService: ArticleService,
    private router: Router,
    private authService: PiAuthService
  ) {}

  ngOnInit(): void {
    this.isAdmin = this.authService.isAdmin();
    this.fetchPendingArticles();
  }

  fetchPendingArticles(): void {
    this.articleService.getPendingArticles().subscribe({
      next: (articles) => {
        this.pendingArticles = articles;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error loading pending articles';
        this.loading = false;
      },
    });
  }

  publishArticle(articleId: number): void {
    this.articleService.approveArticle(articleId).subscribe({
      next: () => {
        this.pendingArticles = this.pendingArticles.filter(
          (a) => a.id !== articleId
        );
      },
      error: () => {
        this.error = 'Failed to publish the article.';
      },
    });
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
            this.pendingArticles = this.pendingArticles.filter(
              (a) => a.id !== this.articleIdToDelete
            );
            this.showDeleteModal = false;
            this.articleIdToDelete = null;
          },
          error: () => {
            this.error = 'The article could not be deleted.';
            this.showDeleteModal = false;
          },
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.articleIdToDelete = null;
  }

  openRejectModal(id: number): void {
    this.articleIdToReject = id;
    this.rejectionReason = '';
    this.showRejectModal = true;
  }

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
          },
          error: () => {
            this.error = 'No se pudo rechazar el artículo.';
            this.showRejectModal = false;
          },
        });
    }
  }

  cancelReject(): void {
    this.showRejectModal = false;
    this.articleIdToReject = null;
    this.rejectionReason = '';
  }
}
