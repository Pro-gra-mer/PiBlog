import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';

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

  constructor(private articleService: ArticleService, private router: Router) {}

  ngOnInit(): void {
    this.articleService.getDrafts().subscribe({
      next: (articles) => {
        this.drafts = articles;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error loading drafts';
        this.loading = false;
      },
    });
  }

  editDraft(id: number): void {
    const userData = localStorage.getItem('user');
    const isAdmin = userData && JSON.parse(userData).role === 'ADMIN';

    const basePath = isAdmin
      ? '/admin-dashboard/edit-article'
      : '/user-dashboard/edit-article';
    this.router.navigate([basePath, id]);
  }

  sendForReview(articleId: number): void {
    this.articleService.submitArticleForReview(articleId).subscribe({
      next: () => {
        this.drafts = this.drafts.filter((d) => d.id !== articleId);
        alert('Artículo enviado para revisión.');
      },
      error: (err) => {
        console.error('Error al enviar a revisión:', err);
        alert('No se pudo enviar el artículo a revisión.');
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
            this.drafts = this.drafts.filter(
              (d) => d.id !== this.articleIdToDelete
            );
            this.showDeleteModal = false;
            this.articleIdToDelete = null;
          },
          error: (err) => {
            console.error('Error al eliminar el artículo:', err);
            this.error = 'No se pudo eliminar el borrador.';
            this.showDeleteModal = false;
          },
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.articleIdToDelete = null;
  }
}
