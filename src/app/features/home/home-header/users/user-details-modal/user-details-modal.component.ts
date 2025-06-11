import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common'; // Mantenha DatePipe aqui
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './user-details-modal.component.html',
  styleUrls: ['./user-details-modal.component.scss'],
  providers: [DatePipe],
})
export class UserDetailsModalComponent implements OnInit {
  createdHouses: HousingLocation[] = [];
  editedHouses: HousingLocation[] = [];
  deletedHouses: HousingLocation[] = [];
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private housingService: HousingService
  ) {}

  ngOnInit() {
    this.isLoading = true;
    // 1. Chame o novo método que busca o histórico completo de casas
    this.housingService.getAllLocationsWithHistory().subscribe((allHouses) => {
      // 2. Filtra apenas as casas ativas para as listas de criadas/editadas
      const activeHouses = allHouses.filter((house) => !house.deletedBy);

      this.createdHouses = activeHouses.filter(
        (h) => h.createBy === this.data.user.id
      );

      this.editedHouses = activeHouses.filter(
        (h) =>
          h.editedBy === this.data.user.id && h.createBy !== this.data.user.id
      );

      // 3. Filtra apenas as casas deletadas para a lista de deletadas
      this.deletedHouses = allHouses.filter(
        (h) => h.deletedBy && h.deletedBy === this.data.user.id
      );

      this.isLoading = false;
    });
  }

  trackByHouseId(index: number, house: HousingLocation): string {
    return house.id;
  }
}
