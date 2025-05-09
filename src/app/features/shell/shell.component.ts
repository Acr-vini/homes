// src/app/features/shell/shell.component.ts
import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet,
    MatToolbarModule,
    MatSlideToggleModule,
    MatButtonModule,
    MatIconModule,
  ],
  template: `
    <mat-toolbar class="app-header" *ngIf="isLoggedIn">
      <!-- Seção: logo -->
      <div class="app-header-section app-header-left">
        <a [routerLink]="['/home']" class="app-header-logo">
          <img src="assets/Homes.png" alt="logo" class="app-header-logo-img" />
        </a>
      </div>

      <!-- Seção: navegação central -->
      <div class="app-header-section app-header-center">
        <a mat-button [routerLink]="['/users']" class="app-header-nav-link">
          <mat-icon>person</mat-icon>
          <span>Users</span>
        </a>
        <span class="app-header-divider">|</span>
        <a mat-button [routerLink]="['/about']" class="app-header-nav-link">
          <mat-icon>info</mat-icon>
          <span>About</span>
        </a>
        <span class="app-header-divider">|</span>
        <a mat-button [routerLink]="['/contact']" class="app-header-nav-link">
          <mat-icon>mail</mat-icon>
          <span>Contact</span>
        </a>
      </div>

      <!-- Seção: tema e logout -->
      <div class="app-header-section app-header-right">
        <mat-slide-toggle
          [checked]="isDark"
          (change)="toggleDark($event.checked)"
          class="app-header-toggle"
        >
          <mat-icon>{{ isDark ? 'dark_mode' : 'light_mode' }}</mat-icon>
        </mat-slide-toggle>

        <button mat-icon-button (click)="logout()">
          <mat-icon>logout</mat-icon>
        </button>
      </div>
    </mat-toolbar>
    <router-outlet></router-outlet>
  `,
  styles: [
    `
      * {
        transition: background-color 0.3s ease, color 0.3s ease,
          border-color 0.3s ease;
      }

      :host {
        --content-padding: 10px;
        color: var(--text-color);
      }

      .app-main {
        display: flex;
        flex-direction: column;
        min-height: 100vh;
      }

      .app-header {
        background: var(--purpleHeader);
        padding: 16px 24px;
        display: flex;
        align-items: center;
        justify-content: space-between;
        transition: background-color 0.3s ease;
      }

      // === SEÇÕES DO HEADER ===

      // Logo à esquerda
      .app-header-left {
        display: flex;
        align-items: center;
        justify-content: flex-start;
        flex: 1;
      }

      // Centraliza os links do menu
      .app-header-center {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 2;
        gap: 12px;
        font-weight: 500;
      }

      // Toggle/logout à direita
      .app-header-right {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex: 1;
      }

      // === ESTILO DOS ELEMENTOS ===

      .app-header-logo {
        display: flex;
        align-items: center;
        height: 40px;
      }

      .app-header-logo-img {
        width: 150px;
        height: 50px;
      }

      .app-header-nav-link {
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 4px;
        text-decoration: none;
        font-size: 18px;
        font-weight: 500;

        mat-icon {
          font-size: 20px;
          color: white;
          transition: color 0.3s ease;
        }

        span {
          color: white;
        }
      }

      .app-header-divider {
        opacity: 0.6;
        color: white;
        font-size: 18px;
        font-weight: 300;
      }

      .app-content {
        padding: var(--content-padding);
        flex-grow: 1;
        transition: background-color 0.3s ease, color 0.3s ease;
      }

      // Toggle de tema
      mat-slide-toggle {
        color: white;

        mat-icon {
          font-size: 24px;
          color: var(--toggle);
          transition: color 0.3s ease;
        }
      }

      // Tema claro e escuro
      body.dark-theme {
        --card-bg: #cccccc;
        color: #ffffff;
      }

      body.light-theme {
        --card-bg: #444444;
        color: #000000;
      }

      // Exemplo de possível seção futura
      .app-users-header-section {
        color: white;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
    `,
  ],
})
export class ShellComponent {
  private authService = inject(AuthService);

  /** Para saber se exibe header/logout */
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  /** Estado do tema */
  isDark = localStorage.getItem('darkMode') === 'true';

  /** Alterna tema claro/escuro */
  toggleDark(on: boolean) {
    this.isDark = on;
    document.body.classList.toggle('dark-theme', on);
    document.body.classList.toggle('light-theme', !on);
    localStorage.setItem('darkMode', String(on));
  }

  /** Efetua logout */
  logout() {
    this.authService.logout();
  }
}
