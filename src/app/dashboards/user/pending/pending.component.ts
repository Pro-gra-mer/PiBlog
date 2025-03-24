import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';
import { Router } from '@angular/router';
import { ArticleDetailComponent } from '../../../components/article-detail/article-detail.component';
import { PiAuthService } from '../../../services/pi-auth.service';

@Component({
  selector: 'app-pending',
  standalone: true,
  imports: [CommonModule, ArticleDetailComponent],
  templateUrl: './pending.component.html',
  styleUrl: './pending.component.css',
})
export class PendingComponent implements OnInit {
  pendingArticles: Article[] = [];
  previousPendingIds: number[] = [];
  loading = true;
  error = '';
  selectedArticleId: number | null = null;
  selectedArticle: Article | undefined;
  publishedMessage: string | null = null;
  lastPublishedArticleId: number | null = null;
  isAdmin: boolean = false;

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
        const currentIds = articles.map((a) => a.id);
        const publishedIds = this.previousPendingIds.filter(
          (prevId) => !currentIds.includes(prevId)
        );

        if (publishedIds.length > 0) {
          const published = this.pendingArticles.find((a) =>
            publishedIds.includes(a.id)
          );
          if (published) {
            this.publishedMessage = `Your article titled "${published.title}" has been published.`;
          }
        }

        this.pendingArticles = articles;
        this.previousPendingIds = currentIds;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error loading pending articles';
        this.loading = false;
      },
    });
  }

  viewArticle(id: number): void {
    if (this.selectedArticleId === id) {
      this.selectedArticleId = null;
      this.selectedArticle = undefined;
    } else {
      this.selectedArticleId = id;
      this.articleService.getArticleById(id).subscribe({
        next: (article) => {
          this.selectedArticle = article;
        },
        error: () => {
          this.error = 'Failed to load the article.';
        },
      });
    }
  }

  isSelected(id: number): boolean {
    return this.selectedArticleId === id;
  }

  getSelectedArticle(id: number): Article | undefined {
    return this.selectedArticleId === id ? this.selectedArticle : undefined;
  }

  publishArticle(articleId: number): void {
    this.articleService.approveArticle(articleId).subscribe({
      next: () => {
        this.pendingArticles = this.pendingArticles.filter(
          (a) => a.id !== articleId
        );
        this.publishedMessage = 'The article has been successfully published.';
        this.lastPublishedArticleId = articleId;

        setTimeout(() => {
          this.publishedMessage = null;
          this.lastPublishedArticleId = null;
        }, 3000);
      },
      error: () => {
        this.error = 'Failed to publish the article.';
      },
    });
  }
}
