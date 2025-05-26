import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';

export interface Application {
  id: string;
  userId: string;
  houseId: string;
  typeOfBusiness: 'sell' | 'rent';
  houseName: string;
  city: string;
  state: string;
  visitDate?: string;
  visitTime?: string;
  checkInDate?: string;
  checkOutDate?: string;
  timestamp: string;
}

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  private storageKey = 'user_applications';

  delete(applicationId: string): Observable<void> {
    const apps = this.getAll().filter((app) => app.id !== applicationId);
    localStorage.setItem(this.storageKey, JSON.stringify(apps));
    return of(undefined);
  }

  // Recupera todas as aplicações do localStorage
  getAll(): Application[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  // Adiciona uma nova aplicação
  add(app: Application): void {
    const arr = this.getAll();
    app.id = app.id || this.generateId();
    arr.push(app);
    localStorage.setItem(this.storageKey, JSON.stringify(arr));
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 12) + Date.now();
  }

  // Retorna só as aplicações do usuário atual
  getByUser(userId: string): Application[] {
    return this.getAll().filter((a) => a.userId === userId);
  }

  update(applicationId: string, updatedApp: Application): Observable<void> {
    const apps = this.getAll().map((app) =>
      app.id === applicationId ? { ...app, ...updatedApp } : app
    );
    localStorage.setItem(this.storageKey, JSON.stringify(apps));
    return of(undefined);
  }
}
