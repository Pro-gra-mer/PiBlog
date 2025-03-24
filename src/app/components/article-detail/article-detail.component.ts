import { Component, OnInit, Input, ViewEncapsulation } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { Article } from '../../models/Article.model';
import { ArticleService } from '../../services/article.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-article-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './article-detail.component.html',
  styleUrls: ['./article-detail.component.css'],
  encapsulation: ViewEncapsulation.None, // Desactiva la encapsulación
})
export class ArticleDetailComponent implements OnInit {
  @Input() article?: Article;
  safeContent: SafeHtml = '';
  message: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    if (!this.article) {
      const articleId = this.route.snapshot.paramMap.get('id');
      if (articleId) {
        this.articleService.getArticleById(+articleId).subscribe({
          next: (data: Article) => {
            this.article = data;
            this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
              data.content
            );
          },
          error: (err) => {
            console.error('Error fetching article detail', err);
            this.message = 'Failed to load the article.';
          },
        });
      }
    } else {
      this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
        this.article.content
      );
    }
  }
}
