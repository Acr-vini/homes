import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

import { User } from '../interfaces/user.interface';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private baseUrl = 'https://api-homes-7kt5olzh4q-rj.a.run.app/api/User';

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

  // Busca usuário por email e senha
  authenticate(email: string, password: string): Observable<User | null> {
    return this.http
      .get<User[]>(`${this.baseUrl}?email=${email}&password=${password}`)
      .pipe(map((users) => (users.length ? users[0] : null)));
  }
}
