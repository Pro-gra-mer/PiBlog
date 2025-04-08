import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../environments/environment.dev';

@Injectable({ providedIn: 'root' })
export class PromotedVideoService {
  constructor(private http: HttpClient) {}

  getPromotedVideos(): Observable<string[]> {
    return this.http.get<string[]>(
      `${environment.apiUrl}/api/articles/promoted-videos`
    );
  }
}
