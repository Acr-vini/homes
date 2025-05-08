// src/app/core/services/user.service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

// Defina a interface User (pode extrair num arquivo models/user.ts)
export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  status: string;
  role: string;
  phone: string;
  location: string;
}

@Injectable({
  providedIn: 'root',
})
export class UserService {
  // URL base do seu json-server
  private baseUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient) {}

  /** GET: retorna lista de usuários */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(this.baseUrl);
  }

  /** GET: retorna um usuário por ID */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.baseUrl}/${id}`);
  }

  /** PUT: atualiza um usuário */
  updateUser(user: User): Observable<User> {
    return this.http.put<User>(`${this.baseUrl}/${user.id}`, user);
  }

  /** DELETE: deleta um usuário */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  /** POST: cria um novo usuário */
  createUser(user: Omit<User, 'id'>): Observable<User> {
    return this.http.post<User>(this.baseUrl, user);
  }
}
