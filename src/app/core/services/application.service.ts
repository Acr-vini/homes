import { Injectable } from '@angular/core';

export interface Application {
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

  // Recupera todas as aplicações do localStorage
  getAll(): Application[] {
    return JSON.parse(localStorage.getItem(this.storageKey) || '[]');
  }

  // Adiciona uma nova aplicação
  add(app: Application): void {
    const arr = this.getAll();
    arr.push(app);
    localStorage.setItem(this.storageKey, JSON.stringify(arr));
  }

  // Retorna só as aplicações do usuário atual
  getByUser(userId: string): Application[] {
    return this.getAll().filter((a) => a.userId === userId);
  }
}
