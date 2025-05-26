import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HousingLocation } from '../../../core/interfaces/housinglocation.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../../home/SCF/create/create.component';
import { EditComponent } from '../../home/house-cards/edit/edit.component';
import { MatChipsModule } from '@angular/material/chips';
import { NgxSpinnerModule } from 'ngx-spinner';

@Component({
  selector: 'app-house-cards',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatChipsModule,
    NgxSpinnerModule, // Adicione aqui
  ],
  templateUrl: './house-cards.component.html',
  styleUrls: ['./house-cards.component.scss'],
})
export class HouseCardsComponent {
  @Input() housingLocation!: HousingLocation;

  constructor(private dialog: MatDialog) {}

  loading = false; // Adicione esta variável

  get currentUserRole(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.role || null;
  }

  get currentUserId(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.id ? String(user.id) : null;
  }

  get favoriteKey(): string {
    return `favoriteHouses_${this.currentUserId}`;
  }

  get favoriteIds(): string[] {
    return JSON.parse(localStorage.getItem(this.favoriteKey) || '[]');
  }

  isFavorited(house: HousingLocation): boolean {
    return this.favoriteIds.includes(String(house.id));
  }

  toggleFavorite(house: HousingLocation): void {
    this.loading = true;
    setTimeout(() => {
      const id = String(house.id);
      let ids = this.favoriteIds;
      if (this.isFavorited(house)) {
        ids = ids.filter((favId) => favId !== id);
      } else {
        ids = [...ids, id]; // Use spread para criar novo array
      }
      localStorage.setItem(this.favoriteKey, JSON.stringify(ids));
      this.loading = false;
    }, 500); // Simule um pequeno delay
  }

  openCreateHouse() {
    this.dialog.open(CreateComponent, {
      width: '700px',
      minWidth: '800px',
      disableClose: true,
      autoFocus: false,
    });
  }

  // Exemplo de uso do spinner em uma ação demorada:
  openEditHouse(houseId: string) {
    this.loading = true;
    setTimeout(() => {
      // Simule carregamento, troque por sua lógica real
      this.dialog.open(EditComponent, {
        width: '700px',
        minWidth: '800px',
        data: { id: houseId },
        disableClose: true,
        autoFocus: false,
      });
      this.loading = false;
    }, 1000);
  }
}
