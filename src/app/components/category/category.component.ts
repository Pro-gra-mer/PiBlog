// category.component.ts
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { Article } from '../../models/Article.model';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
})
export class CategoryComponent implements OnInit {
  articles: Article[] = [];
  categorySlug: string = '';
  loading = true;
  error: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.categorySlug = slug;
        this.loadArticlesByCategory(slug);
      }
    });
  }

  loadArticlesByCategory(slug: string): void {
    this.articleService.getArticlesByCategorySlug(slug).subscribe({
      next: (data) => {
        console.log('📦 Artículos recibidos:', data);
        this.articles = data;
        this.loading = false;
      },
      error: (err) => {
        console.error('❌ Error fetching articles by category', err);
        this.error = 'Could not load articles.';
        this.loading = false;
      },
    });
  }

  getCategoryTitleFromSlug(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
}
