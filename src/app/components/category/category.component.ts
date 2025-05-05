import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ArticleService } from '../../services/article.service';
import { Article } from '../../models/Article.model';
import { CommonModule } from '@angular/common';
import { PromotedVideoService } from '../../services/promoted-video.service';
import { SliderComponent } from '../slider/slider.component';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment.dev';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { Category } from '../../models/Category.model';
import { CategoryService } from '../../services/category.service';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [CommonModule, RouterLink, SliderComponent, SidebarComponent],
  templateUrl: './category.component.html',
  styleUrls: ['./category.component.css'],
})
export class CategoryComponent implements OnInit, OnDestroy {
  articles: Article[] = [];
  categorySlug: string = '';
  loading = true;
  error: string | null = null;
  videos: string[] = [];
  showSlider = false;
  private routeSub: Subscription;
  category: Category | null = null;

  constructor(
    private route: ActivatedRoute,
    private articleService: ArticleService,
    private promotedVideoService: PromotedVideoService,
    private categoryService: CategoryService
  ) {
    this.routeSub = new Subscription();
  }

  ngOnInit(): void {
    this.routeSub = this.route.paramMap.subscribe((params) => {
      const slug = params.get('slug');
      if (slug) {
        this.categorySlug = slug;
        this.loadArticlesByCategory(slug);
        this.loadCategoryVideos(slug);
        this.loadCategoryInfo(slug);
      }
    });
  }

  loadArticlesByCategory(slug: string): void {
    this.loading = true;
    this.articleService.getArticlesByCategorySlug(slug).subscribe({
      next: (data) => {
        this.articles = data;
        this.loading = false;
      },
      error: () => {
        this.error = 'Could not load articles.';
        this.loading = false;
        if (!environment.production) {
          console.error('Failed to load articles for category');
        }
      },
    });
  }

  loadCategoryVideos(slug: string): void {
    this.promotedVideoService.getPromotedVideosByCategory(slug).subscribe({
      next: (data) => {
        if (!environment.production) {
          console.log(`Videos for ${slug}:`, data);
        }
        this.videos = data;
        this.showSlider = data.length > 0;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load category videos');
        }
        this.showSlider = false;
      },
    });
  }

  getCategoryTitleFromSlug(slug: string): string {
    return slug
      .split('-')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  ngOnDestroy(): void {
    if (this.routeSub) {
      this.routeSub.unsubscribe();
    }
  }

  loadCategoryInfo(slug: string): void {
    this.categoryService.getCategoryBySlug(slug).subscribe({
      next: (data) => {
        this.category = data;
      },
      error: () => {
        if (!environment.production) {
          console.error('Failed to load category info');
        }
      },
    });
  }
}
