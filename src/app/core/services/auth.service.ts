import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  // Controle reativo do estado de autenticação
  private loggedIn = new BehaviorSubject<boolean>(this.hasToken());

  constructor(private router: Router) {}

  // Simula login com usuário/senha fixos
  login(email: string, password: string): boolean {
    // Substitua esses dados por uma integração real no futuro
    const validEmail = 'admin@email.com';
    const validPassword = '123456';

    if (email === validEmail && password === validPassword) {
      localStorage.setItem('token', 'fake-jwt-token');
      this.loggedIn.next(true); // atualiza estado reativo
      return true;
    }

    return false;
  }

  // Remove o token e atualiza o estado
  logout(): void {
    localStorage.removeItem('token');
    this.loggedIn.next(false);
    this.router.navigate(['/login']); // redireciona ao logout
  }

  // Observável para saber se o usuário está logado
  isLoggedIn(): Observable<boolean> {
    return this.loggedIn.asObservable();
  }

  // Método interno para verificar token
  private hasToken(): boolean {
    return !!localStorage.getItem('token');
  }
}
