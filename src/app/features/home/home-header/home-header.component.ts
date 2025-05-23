import { Component, inject } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-home-header',
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
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.scss'],
})
export class homeheaderComponent {
  private authService = inject(AuthService);

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userRole(): string | null {
    return this.authService.getCurrentUserRole();
  }

  isDark = localStorage.getItem('darkMode') === 'true';

  toggleDark(on: boolean) {
    this.isDark = on;
    document.body.classList.toggle('dark-theme', on);
    document.body.classList.toggle('light-theme', !on);
    localStorage.setItem('darkMode', String(on));
  }

  logout() {
    this.authService.logout();
  }
}
