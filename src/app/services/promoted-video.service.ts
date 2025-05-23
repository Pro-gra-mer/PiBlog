import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.dev';
import { PromoteType } from '../models/PromoteType';

@Injectable({ providedIn: 'root' })
export class PromotedVideoService {
  constructor(private http: HttpClient) {}

  getPromotedVideos(): Observable<string[]> {
    const params = { type: PromoteType.MAIN_SLIDER };
    return this.http.get<string[]>(
      `${environment.apiUrl}/api/articles/promoted-videos`,
      { params }
    );
  }

  getPromotedVideosByCategory(slug: string): Observable<string[]> {
    return this.http.get<string[]>(
      `${environment.apiUrl}/api/articles/promoted-videos/category/${slug}`
    );
  }
}
