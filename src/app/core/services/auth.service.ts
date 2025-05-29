import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {
  // holds current login status (true if token exists)
  private loggedIn$ = new BehaviorSubject<boolean>(this.checkTokenExists());

  // authentication endpoint URL
  private apiUrl = 'https://api-homes-7kt5olzh4q-rj.a.run.app/api/auth/login';

  constructor(private http: HttpClient, private router: Router) {}

  /**
   * Attempts user login, stores token on success,
   * returns Observable<boolean> indicating login result.
   */
  login(email: string, password: string): Observable<boolean> {
    return this.http.post<any>(this.apiUrl, { email, password }).pipe(
      switchMap((response) => {
        // log raw response for inspection
        console.log('Login response raw:', response);

        // dynamic extraction of token and optional user
        const token: string | undefined = response.token;
        const user: any | undefined = response.user;

        // guard: token must exist
        if (!token) {
          console.error('No access token in response');
          return throwError(() => new Error('No access token in response'));
        }

        // optional guard: if user exists and is disabled
        if (user && user.status === 'disabled') {
          return throwError(() => new Error('disabled'));
        }

        // save token and optional user
        localStorage.setItem('token', token);
        if (user) {
          localStorage.setItem('currentUser', JSON.stringify(user));
        }
        this.loggedIn$.next(true);

        return of(true);
      }),
      catchError((err: any) => {
        // log full error for debugging
        console.error('Full login error:', err);

        // extract backend message or fallback
        const backendMsg =
          err.error?.message ?? err.message ?? JSON.stringify(err);

        return throwError(() => new Error(backendMsg));
      })
    );
  }

  /** Clears token and user info, then navigates to login page */
  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    this.loggedIn$.next(false);
    this.router.navigate(['/login']);
  }

  /** Synchronous check for login status */
  isLoggedIn(): boolean {
    return this.loggedIn$.value;
  }

  /** Observable stream for login status */
  isLoggedIn$(): Observable<boolean> {
    return this.loggedIn$.asObservable();
  }

  /** Retrieves stored token */
  getToken(): string | null {
    return localStorage.getItem('token');
  }

  /** Retrieves the current user object */
  getCurrentUser(): any | null {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  }

  /** Retrieves the current user's role */
  getCurrentUserRole(): string | null {
    const user = this.getCurrentUser();
    return user?.role ?? null;
  }

  /** Checks if a token exists in storage */
  private checkTokenExists(): boolean {
    return !!localStorage.getItem('token');
  }
}
