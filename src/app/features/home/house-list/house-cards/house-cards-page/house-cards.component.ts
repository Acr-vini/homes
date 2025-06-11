import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../../../../home/SCF/create/create.component';
import { EditComponent } from '../../house-cards/edit/edit.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-house-cards',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    NgxSpinnerModule,
  ],
  templateUrl: './house-cards.component.html',
  styleUrls: ['./house-cards.component.scss'],
})
export class HouseCardsComponent {
  @Input() housingLocation!: HousingLocation;

  constructor(private dialog: MatDialog, private spinner: NgxSpinnerService) {}

  applications: any[] = [];

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
    setTimeout(() => {
      const id = String(house.id);
      let ids = this.favoriteIds;
      if (this.isFavorited(house)) {
        ids = ids.filter((favId) => favId !== id);
      } else {
        ids = [...ids, id];
      }
      localStorage.setItem(this.favoriteKey, JSON.stringify(ids));
    }, 500);
  }

  openCreateHouse() {
    this.dialog.open(CreateComponent, {
      width: '700px',
      minWidth: '800px',
      disableClose: true,
      autoFocus: false,
    });
  }

  openEditHouse(houseId: string) {
    setTimeout(() => {
      this.dialog.open(EditComponent, {
        width: '700px',
        minWidth: '800px',
        data: { id: houseId },
        disableClose: true,
        autoFocus: false,
      });
    }, 1000);
  }
}
