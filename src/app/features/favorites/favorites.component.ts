import { Component, OnInit, DoCheck, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../core/services/housing.service';
import { HousingLocation } from '../housinglocation';
import { HousingLocationComponent } from '../housing-location/housing-location.component';

@Component({
  selector: 'app-favorites',
  standalone: true,
  templateUrl: './favorites.component.html',
  styleUrls: ['./favorites.component.scss'],
  imports: [CommonModule, HousingLocationComponent],
})
export class FavoritesComponent implements OnInit, DoCheck {
  private housingService = inject(HousingService);
  favoriteHouses: HousingLocation[] = [];
  private allHouses: HousingLocation[] = [];

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
}
