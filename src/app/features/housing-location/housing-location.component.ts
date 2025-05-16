import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HousingLocation } from '../housinglocation';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../create/create.component';
import { EditComponent } from '../edit/edit.component';

@Component({
  selector: 'app-housing-location',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule],
  templateUrl: './housing-location.html',
  styleUrls: ['./housing-location.component.scss'],
})
export class HousingLocationComponent {
  @Input() housingLocation!: HousingLocation;

  constructor(private dialog: MatDialog) {}

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
    const id = String(house.id);
    let ids = this.favoriteIds;
    if (this.isFavorited(house)) {
      ids = ids.filter((favId) => favId !== id);
    } else {
      ids = [...ids, id]; // Use spread para criar novo array
    }
    localStorage.setItem(this.favoriteKey, JSON.stringify(ids));
  }

  openCreateHouse() {
    this.dialog.open(CreateComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
    });
  }

  openEditHouse(houseId: string) {
    this.dialog.open(EditComponent, {
      width: '500px',
      data: { id: houseId },
      disableClose: true,
      autoFocus: false,
    });
  }
}
