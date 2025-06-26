import {
  Component,
  inject,
  OnInit,
  OnDestroy,
  ChangeDetectorRef,
} from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../../core/services/auth.service';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatBadgeModule } from '@angular/material/badge';
import { NotificationService } from '../../../../core/services/notification.service';
import { Subscription } from 'rxjs';

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
    MatBadgeModule,
  ],
  templateUrl: './home-header.component.html',
  styleUrls: ['./home-header.component.scss'],
})
export class homeheaderComponent implements OnInit, OnDestroy {
  // --- INJEÇÃO DE SERVIÇOS ---
  private authService = inject(AuthService);
  private notificationService = inject(NotificationService);
  private cdr = inject(ChangeDetectorRef); // Injeta o ChangeDetectorRef

  // --- PROPRIEDADES DO COMPONENTE ---
  loading = true;
  newApplicationCount = 0;
  private notificationSub!: Subscription;
  isDark = false;

  // --- GETTERS ---
  get isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  get userRole(): string | null {
    return this.authService.getCurrentUserRole();
  }

  // --- MÉTODOS ---
  toggleDark(on: boolean) {
    this.isDark = on;
    document.body.classList.toggle('dark-theme', on);
    document.body.classList.toggle('light-theme', !on);
    localStorage.setItem('darkMode', String(on));
  }

  logout() {
    this.authService.logout();
    this.notificationService.clearNotifications();
  }

  ngOnInit(): void {
    // 1. Lê a preferência do usuário do localStorage.
    const savedDarkMode = localStorage.getItem('darkMode') === 'true';
    // 2. Aplica o tema salvo ao iniciar o componente.
    this.toggleDark(savedDarkMode);

    // Simulação de carregamento
    this.loading = true;
    setTimeout(() => {
      this.loading = false;
    }, 1500);

    // Inicia a verificação de notificações se o usuário estiver logado
    if (this.isLoggedIn) {
      this.notificationService.checkForNewApplications();
    }

    // --- LÓGICA DA SUBSCRIPTION ---
    // Apenas uma subscrição é necessária
    this.notificationSub = this.notificationService
      .getNewApplicationsCount()
      .subscribe((count) => {
        // Atualiza a contagem de aplicações
        this.newApplicationCount = count;

        // Força a atualização da tela para garantir que o badge apareça/desapareça
        this.cdr.detectChanges();
      });
  }

  ngOnDestroy(): void {
    // Cancela a subscrição para evitar memory leaks
    if (this.notificationSub) {
      this.notificationSub.unsubscribe();
    }
  }
}
