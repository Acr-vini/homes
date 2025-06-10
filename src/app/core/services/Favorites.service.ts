import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class FavoritesService {
  private currentUserFavoriteIds = new BehaviorSubject<string[]>([]);

  constructor() {
    // Opcional: Carregar favoritos do usuário logado ao iniciar o serviço
    // Isso pode ser feito aqui ou quando o usuário fizer login/o serviço for usado pela primeira vez.
    // Por simplicidade, vamos deixar que os componentes solicitem o carregamento inicial.
  }

  private getStorageKey(userId: string): string {
    return `favoriteHouses_${userId}`;
  }

  private getCurrentUserId(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.id ? String(user.id) : null;
  }

  // Carrega os favoritos do localStorage e atualiza o BehaviorSubject
  loadUserFavorites(): void {
    const userId = this.getCurrentUserId();
    if (userId) {
      const storageKey = this.getStorageKey(userId);
      const favoriteIds: string[] = JSON.parse(
        localStorage.getItem(storageKey) || '[]'
      );
      this.currentUserFavoriteIds.next(favoriteIds);
    } else {
      this.currentUserFavoriteIds.next([]); // Nenhum usuário logado, nenhum favorito
    }
  }

  // Retorna um observable para que os componentes possam se inscrever nas mudanças
  getFavoritesObservable(): Observable<string[]> {
    // Garante que os favoritos sejam carregados se ainda não foram
    if (
      this.currentUserFavoriteIds.getValue().length === 0 &&
      localStorage.getItem('currentUser')
    ) {
      // Se o BehaviorSubject está vazio mas há um usuário, tenta carregar.
      // Isso pode acontecer se o serviço for injetado antes do login ou se a página for recarregada.
      // Uma lógica mais robusta poderia ser integrada com o AuthService.
      this.loadUserFavorites();
    }
    return this.currentUserFavoriteIds.asObservable();
  }

  // Retorna a lista atual de IDs de favoritos (sincronamente)
  getCurrentFavoriteIds(): string[] {
    return this.currentUserFavoriteIds.getValue();
  }

  isHouseFavorited(houseId: string): boolean {
    const currentIds = this.currentUserFavoriteIds.getValue();
    return currentIds.includes(houseId);
  }

  toggleFavorite(houseId: string): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      console.warn('User not logged in. Cannot toggle favorite.');
      // Poderia emitir um evento ou redirecionar para login
      return;
    }

    const storageKey = this.getStorageKey(userId);
    let favoriteIds = this.getCurrentFavoriteIds(); // Pega do BehaviorSubject

    const houseIdStr = String(houseId); // Garante que é string

    if (favoriteIds.includes(houseIdStr)) {
      // Remove
      favoriteIds = favoriteIds.filter((id) => id !== houseIdStr);
    } else {
      // Adiciona
      favoriteIds = [...favoriteIds, houseIdStr];
    }

    localStorage.setItem(storageKey, JSON.stringify(favoriteIds));
    this.currentUserFavoriteIds.next(favoriteIds); // Emite a nova lista
  }

  clearAllUserFavorites(): void {
    const userId = this.getCurrentUserId();
    if (!userId) {
      return;
    }
    const storageKey = this.getStorageKey(userId);
    localStorage.removeItem(storageKey);
    this.currentUserFavoriteIds.next([]); // Emite lista vazia
  }
}
