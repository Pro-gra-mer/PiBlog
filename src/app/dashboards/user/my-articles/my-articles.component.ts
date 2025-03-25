import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ArticleService } from '../../../services/article.service';
import { Article } from '../../../models/Article.model';

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

  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.articleService.getUserPublishedArticles().subscribe({
      next: (articles) => {
        this.articles = articles;
        this.loading = false;
      },
      error: () => {
        this.error = 'Error loading your published articles.';
        this.loading = false;
      },
    });
  }
}
