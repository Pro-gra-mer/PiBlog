import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { Article } from '../models/Article.model';
import { environment } from '../environments/environment.dev';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ArticleService {
  private apiUrl = environment.apiUrl + '/api/articles';

  constructor(private http: HttpClient) {}

  // Obtener todos los artículos ordenados por fecha
  getPublicArticles(order: 'desc' | 'asc' = 'desc'): Observable<Article[]> {
    return this.http.get<Article[]>(this.apiUrl).pipe(
      map((articles) =>
        articles.sort((a, b) => {
          const dateA = new Date(a.publishDate).getTime();
          const dateB = new Date(b.publishDate).getTime();
          if (dateA === dateB) {
            // Si las fechas son iguales, se ordena por id como criterio de desempate
            return order === 'desc' ? b.id - a.id : a.id - b.id;
          }
          return order === 'desc' ? dateB - dateA : dateA - dateB;
        })
      )
    );
  }

  // Obtener un artículo por su id
  getArticleById(id: number): Observable<Article> {
    return this.http.get<Article>(`${this.apiUrl}/${id}`);
  }

  // Crear un nuevo artículo, incluyendo los metadatos de la imagen
  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, article);
  }

  // Actualizar un artículo (por ejemplo, para aprobarlo) incluyendo los nuevos campos de imagen
  updateArticle(id: number, article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}`, article);
  }

  // Eliminar un artículo
  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  // Este endpoint se implementaría en el backend para que, dado un publicId, elimine el archivo.
  deleteOrphanImage(publicId: string): Observable<any> {
    return this.http.delete(`${environment.apiUrl}/api/cleanup/${publicId}`, {
      responseType: 'text',
    });
  }

  getDrafts(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/drafts`);
  }

  submitArticleForReview(articleId: number): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${articleId}/submit`, {});
  }

  getPendingArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/pending`);
  }

  approveArticle(id: number): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${id}/approve`, {});
  }

  // Devuelve los artículos publicados del usuario actual
  getUserPublishedArticles(): Observable<Article[]> {
    return this.http.get<Article[]>(`${this.apiUrl}/published`);
  }

  deleteOrphanVideo(publicId: string): Observable<any> {
    return this.http.delete(
      `${environment.apiUrl}/api/cleanup/video/${publicId}`,
      {
        responseType: 'text',
      }
    );
  }

  getArticlesByCategorySlug(slug: string): Observable<Article[]> {
    return this.http.get<Article[]>(
      `${environment.apiUrl}/api/articles/category/${slug}`
    );
  }
}
