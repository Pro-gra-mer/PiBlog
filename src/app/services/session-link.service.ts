import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, map } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SessionLinkService {
  private readonly baseUrl = '/api/session-links';

  constructor(private http: HttpClient) {}

  // 1. Crear código (escritorio)
  createSessionCode(): Observable<string> {
    return this.http
      .post<{ code: string }>(this.baseUrl, {})
      .pipe(map((res) => res.code));
  }

  // 2. Sincronizar sesión (móvil)
  syncSession(code: string, accessToken: string): Observable<void> {
    const headers = new HttpHeaders().set(
      'Authorization',
      `Bearer ${accessToken}`
    );
    return this.http.post<void>(`${this.baseUrl}/sync`, { code }, { headers });
  }

  // 3. Obtener estado del código (opcional, por si no usas WebSocket)
  getStatus(code: string): Observable<{ username: string } | null> {
    return this.http
      .get<{ username: string }>(`${this.baseUrl}/status/${code}`)
      .pipe(map((res) => res ?? null));
  }
}
