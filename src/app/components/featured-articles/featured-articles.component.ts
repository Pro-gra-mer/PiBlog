import { Component, inject } from '@angular/core';
import { Article } from '../../models/Article.model';
import { ArticleService } from '../../services/article.service';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-featured-articles',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './featured-articles.component.html',
  styleUrl: './featured-articles.component.css',
})
export class FeaturedArticlesComponent {
  featuredArticles: Article[] = [];
  constructor(private articleService: ArticleService) {}

  ngOnInit(): void {
    this.articleService.getFeaturedArticles().subscribe((articles) => {
      this.featuredArticles = articles;
    });
  }
}
