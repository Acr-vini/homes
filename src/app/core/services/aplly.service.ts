import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class ApplyService {
  private http = inject(HttpClient);

  private readonly API_URL = 'http://localhost:3000';

  constructor() {}

  // ✅ Pega os dados do usuário logado
  getLoggedUser(): Observable<User> {
    return this.http.get<User>(`${this.API_URL}/loggedUser`);
  }
}
