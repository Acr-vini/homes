import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, switchMap, map } from 'rxjs';
import { HttpClient } from '@angular/common/http';

export interface User {
  role: string;
  id: string;
  email: string;
  password: string;
  status: string;
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
            if (user.role === 'disabled') {
              // Usuário desabilitado
              throw new Error('disabled');
            }
            if (user.status === 'disabled') {
              throw new Error('disabled');
            }
            // sucesso: grava token “fake” e emite estado
            localStorage.setItem('token', 'fake-jwt-token');
            localStorage.setItem('currentUser', JSON.stringify(user));
            localStorage.setItem('isLoggedIn', 'true');
            this.loggedIn$.next(true);
            return true;
          } else {
            return false;
          }
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('isLoggedIn');
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

  getCurrentUserRole(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.role || null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
}
