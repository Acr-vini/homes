import { Component, OnInit, DoCheck, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../core/services/housing.service';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import { HouseCardsComponent } from '../../../home/house-list/house-cards/house-cards-page/house-cards.component';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-favorites',
  standalone: true,
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  imports: [CommonModule, HouseCardsComponent, MatIconModule, MatCardModule],
})
export class FavoritesComponent implements OnInit, DoCheck {
  private housingService = inject(HousingService);
  favoriteHouses: HousingLocation[] = [];
  private allHouses: HousingLocation[] = [];
  snackBar = inject(MatSnackBar);

  get currentUserId(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.id ? String(user.id) : null;
  }

  ngOnInit() {
    this.housingService.getAllHousingLocations().subscribe({
      next: (list) => {
        this.allHouses = list;
        this.updateFavorites();
      },
    });
  }

  ngDoCheck() {
    this.updateFavorites();
  }

  updateFavorites() {
    const userId = this.currentUserId;
    const ids: string[] = userId
      ? JSON.parse(localStorage.getItem(`favoriteHouses_${userId}`) || '[]')
      : [];
    this.favoriteHouses = this.allHouses.filter((h) =>
      ids.includes(String(h.id))
    );
  }
  clearFavorites() {
    const snackBarRef = this.snackBar.open(
      'Are you sure you want to clear all favorites?',
      'Yes',
      { duration: 5000 }
    );
    snackBarRef.onAction().subscribe(() => {
      const userId = this.currentUserId;
      if (userId) {
        localStorage.removeItem(`favoriteHouses_${userId}`);
        this.favoriteHouses = [];
      }
      this.snackBar.open('✅ Favorites cleared!', '', { duration: 2000 });
    });
  }
  isFavorited(house: HousingLocation): boolean {
    const userId = this.currentUserId;
    const ids: string[] = userId
      ? JSON.parse(localStorage.getItem(`favoriteHouses_${userId}`) || '[]')
      : [];
    return ids.includes(String(house.id));
  }

  getFavoriteAriaLabel(house: HousingLocation): string {
    return this.isFavorited(house)
      ? 'Remove from favorites'
      : 'Add to favorites';
  }
}
