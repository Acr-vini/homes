// src/app/core/guards/auth.guard.ts
import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({ providedIn: 'root' })
export class AuthGuard implements CanActivate {
  constructor(private auth: AuthService, private router: Router) {}

  canActivate(): boolean {
    if (this.auth.isLoggedIn()) {
      // Se tiver token válido, permite navegar
      return true;
    }
    // Caso contrário, redireciona para o login
    this.router.navigate(['/login']);
    return false;
  }
}
