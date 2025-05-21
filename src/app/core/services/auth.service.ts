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

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .post<{ accessToken: string; user: User }>(
        'http://localhost:3000/login',
        { email, password }
      )
      .pipe(
        switchMap((response) => {
          console.log('Login response:', response);
          if (response && response.user.status === 'disabled') {
            throw new Error('disabled');
          }
          if (response && response.accessToken) {
            localStorage.setItem('token', response.accessToken);
            localStorage.setItem('currentUser', JSON.stringify(response.user));
            this.loggedIn$.next(true);
            return of(true);
          }
          return of(false);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
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

  getCurrentUserRole(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.role || null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
}
