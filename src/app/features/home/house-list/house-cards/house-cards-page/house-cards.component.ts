import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../../../../home/SCF/create/create.component';
import { EditComponent } from '../../house-cards/edit/edit.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

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

  constructor(
    private dialog: MatDialog,
    private spinner: NgxSpinnerService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {}

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
    // O setTimeout que você tinha. Mantido para não alterar seu comportamento visual.
    setTimeout(() => {
      const id = String(house.id);
      let ids = this.favoriteIds;
      const wasFavorited = this.isFavorited(house); // Verifica o estado ANTES da mudança

      if (wasFavorited) {
        // Lógica para REMOVER um favorito
        ids = ids.filter((favId) => favId !== id);
        this.snackBar.open('Removed from favorites.', '', { duration: 2000 }); // Feedback simples
      } else {
        // Lógica para ADICIONAR um favorito
        ids = [...ids, id];

        // Abre o SnackBar com mensagem e botão de ação
        const snackBarRef = this.snackBar.open(
          'Added to favorites. Go to favorites?',
          'Yes',
          { duration: 5000 }
        );

        // Escuta o clique no botão de ação 'Yes'
        snackBarRef.onAction().subscribe(() => {
          this.router.navigate(['/favorites']); // Navega para a página de favoritos
        });
      }

      // Salva o novo estado no localStorage
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
