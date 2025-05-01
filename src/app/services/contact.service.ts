import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { ContactRequest } from '../models/ContactRequest';

@Injectable({ providedIn: 'root' })
export class ContactService {
  private apiUrl = '/api/contact';

  constructor(private http: HttpClient) {}

  sendMessage(data: ContactRequest) {
    return this.http.post(this.apiUrl, data);
  }
}
