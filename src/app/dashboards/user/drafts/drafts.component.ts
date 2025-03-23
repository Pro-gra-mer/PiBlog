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
    this.router.navigate(['/user-dashboard/edit-article', id]);
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
}
