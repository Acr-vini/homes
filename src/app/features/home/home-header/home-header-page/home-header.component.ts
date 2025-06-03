import { Component, inject, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { NgxSpinnerModule } from 'ngx-spinner';

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
    NgxSpinnerModule,
  ],
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.scss'],
})
export class homeheaderComponent implements OnInit {
  private authService = inject(AuthService);

  loading = true;

  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userRole(): string | null {
    return this.authService.getCurrentUserRole();
  }

  isDark = false; // Sempre começa no light mode

  toggleDark(on: boolean) {
    this.isDark = on;
    document.body.classList.toggle('dark-theme', on);
    document.body.classList.toggle('light-theme', !on);
    localStorage.setItem('darkMode', String(on));
  }

  logout() {
    this.authService.logout();
  }

  ngOnInit(): void {
    // Sempre inicie no light mode
    this.isDark = false;
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    localStorage.setItem('darkMode', 'false');

    // Inicia o spinner ao carregar
    this.loading = true;

    // Simule carregamento de dados (exemplo com setTimeout)
    setTimeout(() => {
      this.loading = false; // Esconde o spinner após carregar
    }, 1500);

    // Se você faz requisições HTTP, coloque this.loading = false no subscribe do sucesso
    // this.seuService.getDados().subscribe(() => this.loading = false);
  }
}
