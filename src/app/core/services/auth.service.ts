import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  id: string;
  email: string;
  password: string;
  // ... outros campos ...
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(this.hasToken());
  private apiUrl = 'http://localhost:3000/users';

  constructor(private http: HttpClient, private router: Router) {}

  /** Consulta o db.json filtrando por email e password */
  login(email: string, password: string): Observable<boolean> {
    // GET /users?email=xxx&password=yyy
    return this.http
      .get<User[]>(`${this.apiUrl}?email=${email}&password=${password}`)
      .pipe(
        map((users) => {
          const user = users[0];
          if (user) {
            // sucesso: grava token “fake” e emite estado
            localStorage.setItem('token', 'fake-jwt-token');
            this.loggedIn$.next(true);
            return true;
          } else {
            return false;
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return this.loggedIn$.value;
  }

  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
}
