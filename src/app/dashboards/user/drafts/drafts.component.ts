import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';
import { environment } from '../../../environments/environment.dev';

@Component({
  selector: 'app-drafts',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './drafts.component.html',
  styleUrl: './drafts.component.css',
})
export class DraftsComponent implements OnInit {
  drafts: Article[] = [];
  loading = true;
  error = '';
  showDeleteModal = false;
  articleIdToDelete: number | null = null;
  successMessage: string | null = null;

  constructor(private articleService: ArticleService, private router: Router) {}

  // Initializes component and loads drafts
  ngOnInit(): void {
    this.articleService.getDrafts().subscribe({
      next: (articles) => {
        this.drafts = articles;
        this.loading = false;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load drafts');
        }
        this.error = 'Failed to load drafts.';
        this.loading = false;
      },
    });
  }

  // Navigates to edit draft page
  editDraft(id: number): void {
    const userData = localStorage.getItem('user');
    const isAdmin = userData && JSON.parse(userData).role === 'ADMIN';
    const basePath = isAdmin
      ? '/admin-dashboard/edit-article'
      : '/user-dashboard/edit-article';
    this.router.navigate([basePath, id]);
  }

  // Submits draft for review
  sendForReview(articleId: number): void {
    this.articleService.submitArticleForReview(articleId).subscribe({
      next: () => {
        this.drafts = this.drafts.filter((d) => d.id !== articleId);
        this.error = 'Article submitted for review successfully.';
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to submit for review');
        }
        this.error = 'Failed to submit article for review.';
      },
    });
  }

  // Opens delete confirmation modal
  openDeleteModal(id: number): void {
    this.articleIdToDelete = id;
    this.showDeleteModal = true;
  }

  // Confirms and deletes draft
  confirmDelete(): void {
    if (this.articleIdToDelete !== null) {
      this.articleService
        .deleteArticleWithCleanup(this.articleIdToDelete)
        .subscribe({
          next: () => {
            this.drafts = this.drafts.filter(
              (d) => d.id !== this.articleIdToDelete
            );
            this.showDeleteModal = false;
            this.articleIdToDelete = null;
            this.successMessage = 'Draft deleted successfully.';
          },
          error: () => {
            if (!environment.production) {
              console.error('Failed to delete draft');
            }
            this.error = 'Failed to delete draft.';
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
}
