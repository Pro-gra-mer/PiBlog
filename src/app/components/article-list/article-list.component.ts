import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

import { Router, RouterModule } from '@angular/router';
import { Article } from '../../models/Article.model';
import { ArticleService } from '../../services/article.service';

@Component({
  selector: 'app-article-list',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './article-list.component.html',
  styleUrls: ['./article-list.component.css'],
})
export class ArticleListComponent implements OnInit {
  articles: Article[] = [];
  message: string | null = null;

  constructor(private articleService: ArticleService, private router: Router) {}

  ngOnInit(): void {
    this.loadArticles();
  }

  loadArticles(): void {
    this.articleService.getArticles().subscribe({
      next: (data: Article[]) => {
        this.articles = data;
      },
      error: (err) => {
        console.error('Error loading articles:', err);
        this.message = 'Error al cargar los artículos.';
      },
    });
  }

  onReadMore(articleId: number): void {
    // Navega a la página de detalle del artículo, por ejemplo: /articles/:id
    this.router.navigate(['/articles', articleId]);
  }
}
