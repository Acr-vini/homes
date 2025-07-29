import {
  Component,
  EventEmitter,
  Input,
  Output,
  ChangeDetectorRef,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CompareService } from '../../../../../core/services/compare.service';

@Component({
  selector: 'app-house-cards',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatIconModule,
    MatTooltipModule,
    NgxSpinnerModule,
    MatSnackBarModule,
  ],
  templateUrl: './house-cards.component.html',
  styleUrls: ['./house-cards.component.scss'],
})
export class HouseCardsComponent {
  @Input() housingLocation!: HousingLocation;
  @Input() displayMode: 'grid' | 'list' = 'grid';
  @Input() compareMode = false;
  @Output() favoriteToggled = new EventEmitter<HousingLocation>();
  @Output() compareToggled = new EventEmitter<HousingLocation>();
  @Output() editClicked = new EventEmitter<string>();

  private spinner = inject(NgxSpinnerService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private compareService = inject(CompareService);

  currentImageIndex = 0;
  private imageCycleInterval: any;

  constructor(private cdr: ChangeDetectorRef) {}

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

  startImageCycle(): void {
    if (this.housingLocation.photos.length > 1) {
      this.imageCycleInterval = setInterval(() => {
        this.currentImageIndex =
          (this.currentImageIndex + 1) % this.housingLocation.photos.length;
        this.cdr.detectChanges(); // Força a detecção de mudanças
      }, 1500); // Muda a imagem a cada 1.5 segundos
    }
  }

  stopImageCycle(): void {
    clearInterval(this.imageCycleInterval);
    this.currentImageIndex = 0;
    this.cdr.detectChanges(); // Garante que a imagem volte para a primeira
  }

  toggleFavorite(house: HousingLocation): void {
    if (!this.currentUserId) {
      this.snackBar.open('Please log in to favorite houses.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const wasFavorited = this.isFavorited(house);
    let favoriteIds = this.favoriteIds;

    if (wasFavorited) {
      favoriteIds = favoriteIds.filter((id) => id !== String(house.id));
      this.snackBar.open('Removed from favorites.', 'Close', {
        duration: 2000,
      });
    } else {
      favoriteIds = [...favoriteIds, String(house.id)];
      const snackBarRef = this.snackBar.open(
        '✅  House favorited. Go to favorites?',
        'Yes',
        { duration: 5000 }
      );

      snackBarRef.onAction().subscribe(() => {
        this.router.navigate(['/favorites']);
      });
    }
    localStorage.setItem(this.favoriteKey, JSON.stringify(favoriteIds));
    this.favoriteToggled.emit(house);
  }

  openCreateHouse() {
    this.router.navigate(['/create-house']);
  }

  openEditHouse(id: string): void {
    this.router.navigate(['/edit-house', id]);
    this.editClicked.emit(id);
  }

  canEditHouse(house: HousingLocation): boolean {
    const role = this.currentUserRole;
    const userId = this.currentUserId;

    if (role === 'Admin' || role === 'Manager') {
      return true; // Admin e Manager podem editar tudo
    }

    if (
      (role === 'Owner' || role === 'Real Estate Agency') &&
      house.ownerId === userId
    ) {
      return true; // Owner e Real Estate Agency podem editar apenas as próprias casas
    }

    return false;
  }

  toggleCompareItem(house: HousingLocation): void {
    this.compareService.toggleCompare(house);
    this.compareToggled.emit(house);
  }

  isInCompareList(): boolean {
    return !!this.compareService
      .getCompareList()
      .find((h) => h.id === this.housingLocation.id);
  }
}
