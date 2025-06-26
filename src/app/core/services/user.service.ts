import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = 'http://localhost:3000';

  constructor(private http: HttpClient) {}

  /** GET: retorna lista de usuários */
  getUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`);
  }

  /** GET: retorna um usuário por ID */
  getUserById(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`);
  }

  /** PUT: atualiza um usuário */
  updateUser(id: string, user: Partial<User>): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}`, user);
  }

  /** DELETE: deleta um usuário */
  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`);
  }

  /** POST: cria um novo usuário */
  createUser(user: Omit<User, 'id'>): Observable<User> {
    const payload = {
      ...user,
      role: user.role === 'Realtor' ? 'Real Estate Agency' : user.role,
    };
    return this.http.post<User>(`${this.apiUrl}/users`, payload);
  }

  // Busca usuário por email e senha
  authenticate(email: string, password: string): Observable<User | null> {
    return this.http
      .get<User[]>(`${this.apiUrl}/users?email=${email}&password=${password}`)
      .pipe(map((users) => (users.length ? users[0] : null)));
  }
}
