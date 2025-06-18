import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { ApplicationService } from './application.service';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private authService = inject(AuthService);
  private applicationService = inject(ApplicationService);

  private newApplicationsCount = new BehaviorSubject<number>(0);
  private lastClearTimestamp = 0;

  getNewApplicationsCount(): Observable<number> {
    return this.newApplicationsCount.asObservable();
  }

  checkForNewApplications(): void {
    const checkRequestTimestamp = Date.now();

    // --- LINHA CORRIGIDA ---
    // Acessamos o usuário e depois a sua propriedade .id, sem "()".
    // O "?" (optional chaining) previne erros se getCurrentUser() retornar null.
    const currentUserId = this.authService.getCurrentUser()?.id;

    if (!currentUserId) {
      this.newApplicationsCount.next(0);
      return;
    }

    this.applicationService
      .getByUser(currentUserId)
      .pipe(catchError(() => of([])))
      .subscribe((applications) => {
        if (checkRequestTimestamp > this.lastClearTimestamp) {
          this.newApplicationsCount.next(applications.length);
        }
      });
  }

  clearNotifications(): void {
    this.lastClearTimestamp = Date.now();
    this.newApplicationsCount.next(0);
  }
}
