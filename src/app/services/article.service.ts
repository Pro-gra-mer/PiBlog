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
  getArticles(order: 'desc' | 'asc' = 'desc'): Observable<Article[]> {
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

  // Crear un nuevo artículo
  createArticle(article: Article): Observable<Article> {
    return this.http.post<Article>(this.apiUrl, article);
  }

  // Actualizar un artículo (por ejemplo, para aprobarlo)
  updateArticle(article: Article): Observable<Article> {
    return this.http.put<Article>(`${this.apiUrl}/${article.id}`, article);
  }

  // Eliminar un artículo
  deleteArticle(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
