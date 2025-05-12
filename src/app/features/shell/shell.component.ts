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
  templateUrl: './shell.component.html', // <-- MOVEMOS PARA HTML EXTERNO
  styleUrls: ['./shell.component.scss'], // <-- MOVEMOS PARA SCSS EXTERNO
})
export class ShellComponent {
  private authService = inject(AuthService);

  /** Para saber se exibe opções privadas */
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
