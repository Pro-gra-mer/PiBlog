import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, switchMap } from 'rxjs/operators';
import { Article } from '../models/Article.model';
import { environment } from '../environments/environment.dev';
import { forkJoin, Observable, of } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private apiUrl = environment.apiUrl + '/api/articles';

  constructor(private http: HttpClient) {}

  // Get all public articles ordered by date
  getPublicArticles(order: 'desc' | 'asc' = 'desc'): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl).pipe(
      map((articles) =>
        articles.sort((a, b) => {
          const dateA = new Date(a.publishDate).getTime();
          const dateB = new Date(b.publishDate).getTime();
          if (dateA === dateB) {
            // If dates are equal, use id as a tie-breaker
            return order === 'desc' ? b.id - a.id : a.id - b.id;
          }
          return order === 'desc' ? dateB - dateA : dateA - dateB;
        })
      )
    );
  }

  // Get an article by its ID
  getArticleById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  // Create a new article, including image metadata
  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, article);
  }

  // Update an article (e.g., to approve it) including image fields
  updateArticle(id: number, article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}`, article);
  }

  // Delete an article
  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Delete orphan image by publicId
  deleteOrphanImage(publicId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/cleanup/${publicId}`, {
      responseType: 'text',
    });
  }

  // Get user's draft articles
  getDrafts(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/drafts`);
  }

  // Submit article for review
  submitArticleForReview(articleId: number): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${articleId}/submit`, {});
  }

  // Get pending articles for review
  getPendingArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/pending`);
  }

  // Approve an article
  approveArticle(id: number): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Get the currently published articles of the user
  getUserPublishedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/published`);
  }

  // Delete orphan video by publicId
  deleteOrphanVideo(publicId: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/cleanup/video/${publicId}`,
      {
        responseType: 'text',
      }
    );
  }

  // Get articles by category slug
  getArticlesByCategorySlug(slug: string): Observable<Article[]> {
    return this.http.get<Article[]>(
      `${environment.apiUrl}/api/articles/category/${slug}`
    );
  }

  // Delete article and clean up orphan images/videos
  deleteArticleWithCleanup(id: number): Observable<void> {
    return this.getArticleById(id).pipe(
      switchMap((article: Article) => {
        const deleteRequests: Observable<any>[] = [];

        // Add image and video deletion requests
        if (article.headerImagePublicId) {
          deleteRequests.push(
            this.deleteOrphanImage(article.headerImagePublicId)
          );
        }

        if (article.promoVideoPublicId) {
          deleteRequests.push(
            this.deleteOrphanVideo(article.promoVideoPublicId)
          );
        }

        // Extract images in content and queue their deletion
        const parser = new DOMParser();
        const doc = parser.parseFromString(article.content || '', 'text/html');
        const imgElements = Array.from(doc.getElementsByTagName('img'));

        imgElements.forEach((img) => {
          const src = img.getAttribute('src') || '';
          const publicId = this.extractPublicIdFromUrl(src);
          if (publicId) {
            deleteRequests.push(this.deleteOrphanImage(publicId));
          }
        });

        // Execute deletion requests and then delete the article
        return forkJoin(
          deleteRequests.length ? deleteRequests : [of(null)]
        ).pipe(switchMap(() => this.deleteArticle(id)));
      })
    );
  }

  // Extract publicId from image/video URL
  private extractPublicIdFromUrl(url: string): string | null {
    const match = url.match(/\/upload\/(?:v\d+\/)?([^\.]+)/);
    return match ? match[1] : null;
  }

  // Get rejected articles by the user
  getUserRejectedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/rejected`);
  }

  // Reject an article with a reason
  rejectArticle(id: number, reason: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${id}/reject`, { reason });
  }

  // Cancel a subscription for an article's plan
  cancelSubscription(articleId: number, planType: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/payments/cancel-subscription`,
      {
        params: {
          articleId: articleId.toString(),
          planType,
        },
        responseType: 'text',
      }
    );
  }

  // Get featured articles
  getFeaturedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/featured`);
  }
}
