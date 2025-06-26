import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private loggedIn$ = new BehaviorSubject<boolean>(this.checkTokenExists());

  private apiUrl = 'http://localhost:3000/auth/login';

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<boolean> {
    return this.http
      .post<any>('http://localhost:3000/auth/login', { email, password })
      .pipe(
        switchMap((response) => {
          const token = response.accessToken;
          const user = response.user;
          if (!token) {
            return throwError(() => new Error('No access token in response'));
          }
          if (user && user.status === 'disabled') {
            return throwError(() => new Error('disabled'));
          }
          localStorage.setItem('token', token);
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.loggedIn$.next(true);
          return of(true);
        }),
        catchError((err) => {
          return throwError(() => new Error(err.error?.message ?? err.message));
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

  getCurrentUser(): any | null {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  getCurrentUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role ?? null;
  }

  private checkTokenExists(): boolean {
    return !!localStorage.getItem('token');
  }
}
