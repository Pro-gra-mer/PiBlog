import { Component, OnInit, Input } from '@angular/core';
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
})
export class ArticleDetailComponent implements OnInit {
  // Se declara como input para poder recibirlo desde otro componente
  @Input() article?: Article;
  safeContent: SafeHtml = '';
  message: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // Si no se recibe el artículo, se carga basándose en la ruta
    if (!this.article) {
      const articleId = this.route.snapshot.paramMap.get('id');
      if (articleId) {
        this.articleService.getArticleById(+articleId).subscribe({
          next: (data: Article) => {
            this.article = data;
            this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
              this.article.content
            );
          },
          error: (err) => {
            console.error('Error fetching article detail', err);
            this.message = 'Error al cargar el artículo.';
          },
        });
      } else {
        this.message = 'No se proporcionó un ID de artículo.';
      }
    } else {
      // Si se recibe el artículo, se sanitiza el contenido
      this.safeContent = this.sanitizer.bypassSecurityTrustHtml(
        this.article.content
      );
    }
  }
}
