import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { PaymentService } from '../../../services/payment.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';

@Component({
  selector: 'app-my-articles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-articles.component.html',
  styleUrl: './my-articles.component.css',
})
export class MyArticlesComponent implements OnInit {
  articles: Article[] = [];
  loading = true;
  error = '';
  showDeleteModal = false;
  articleIdToDelete: number | null = null;

  constructor(
    private articleService: ArticleService,
    private paymentService: PaymentService,
    private router: Router,
    private cdr: ChangeDetectorRef // Para forzar detección de cambios
  ) {}

  ngOnInit(): void {
    this.articleService.getUserPublishedArticles().subscribe({
      next: (articles) => {
        this.articles = articles.filter((article) => article.id != null);
        console.log('Artículos publicados:', this.articles);
        this.loading = false;
        this.cdr.detectChanges(); // Forzar detección de cambios
      },
      error: () => {
        this.error = 'Error loading your published articles.';
        this.loading = false;
        this.cdr.detectChanges();
      },
    });

    // Escuchar el evento para actualizar expirationAt
    this.paymentService.renewalCompleted$.subscribe(
      ({ articleId, expirationAt }) => {
        const updatedArticle = this.articles.find((a) => a.id === articleId);
        if (updatedArticle) {
          updatedArticle.expirationAt = expirationAt;
          console.log(
            `✅ Expiration actualizada para artículo ${articleId}: ${expirationAt}`
          );
          this.cdr.detectChanges(); // Forzar detección de cambios
        } else {
          console.warn(`Artículo con ID ${articleId} no encontrado`);
        }
      }
    );
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
            this.articles = this.articles.filter(
              (a) => a.id !== this.articleIdToDelete
            );
            this.showDeleteModal = false;
            this.articleIdToDelete = null;
            this.cdr.detectChanges();
          },
          error: () => {
            this.error = 'Could not delete the article.';
            this.showDeleteModal = false;
            this.cdr.detectChanges();
          },
        });
    }
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.articleIdToDelete = null;
  }

  renewSubscription(articleId: number, planType: string): void {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (!user.accessToken) {
      alert('You must be logged in with Pi to make payments.');
      return;
    }

    this.paymentService.renewSubscription(articleId, planType);
  }
}
