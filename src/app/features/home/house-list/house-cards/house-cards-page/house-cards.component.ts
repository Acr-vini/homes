import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../../../../home/SCF/create/create.component';
import { EditComponent } from '../edit/edit.component';
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
  @Input() compareMode = false;
  @Input() displayMode: 'grid' | 'list' = 'grid';
  @Output() houseUpdated = new EventEmitter<void>();

  private dialog = inject(MatDialog);
  private spinner = inject(NgxSpinnerService);
  private snackBar = inject(MatSnackBar);
  private router = inject(Router);
  private compareService = inject(CompareService);

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
      const ছিলFavoritado = this.isFavorited(house);

      if (ছিলFavoritado) {
        ids = ids.filter((favId) => favId !== id);
        this.snackBar.open('Removed from favorites.', 'Close', {
          duration: 2000,
        });
      } else {
        ids = [...ids, id];
        const snackBarRef = this.snackBar.open(
          '✅  House favorited. Go to favorites?',
          'Yes',
          { duration: 5000 }
        );

        snackBarRef.onAction().subscribe(() => {
          this.router.navigate(['/favorites']);
        });
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

  openEditHouse(id: string): void {
    const dialogRef = this.dialog.open(EditComponent, {
      width: '500px',
      data: this.housingLocation, // Passa os dados da casa para o diálogo
    });

    dialogRef.afterClosed().subscribe((result) => {
      // Se o resultado for 'true' (ou seja, o formulário foi salvo com sucesso)
      if (result) {
        // Emita o evento para notificar o componente pai que a lista precisa ser atualizada
        this.houseUpdated.emit();
      }
    });
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
  }

  isInCompareList(): boolean {
    return !!this.compareService
      .getCompareList()
      .find((h) => h.id === this.housingLocation.id);
  }
}
