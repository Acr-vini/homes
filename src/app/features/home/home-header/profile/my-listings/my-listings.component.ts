import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { EditComponent } from '../../../house-list/house-cards/edit/edit.component';
import { forkJoin, finalize } from 'rxjs';
import { NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-my-listings',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatSnackBarModule,
    MatDialogModule,
    FormsModule,
    MatFormFieldModule,
    MatSelectModule,
  ],
  templateUrl: './my-listings.component.html',
  styleUrls: ['./my-listings.component.scss'],
})
export class MyListingsComponent implements OnInit {
  @Input() userId!: string;

  private housingService = inject(HousingService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private dialog = inject(MatDialog);
  private spinner = inject(NgxSpinnerService);

  allListings: HousingLocation[] = []; // Guarda a lista original
  myListings: HousingLocation[] = []; // Lista filtrada para a tabela
  displayedColumns: string[] = ['photo', 'name', 'status', 'price', 'actions'];
  filterStatus: 'all' | 'active' | 'deleted' = 'all';

  ngOnInit(): void {
    if (this.userId) {
      this.loadListings();
    }
  }

  loadListings(): void {
    this.housingService
      .getHousesByCreatorId(this.userId)
      .subscribe((listings) => {
        this.allListings = listings;
        this.applyFilter(); // Aplica o filtro inicial
      });
  }

  applyFilter(): void {
    if (this.filterStatus === 'all') {
      this.myListings = [...this.allListings];
    } else {
      const showActive = this.filterStatus === 'active';
      this.myListings = this.allListings.filter(
        (listing) => !listing.deleted === showActive
      );
    }
  }

  editHouse(house: HousingLocation): void {
    const dialogRef = this.dialog.open(EditComponent, {
      width: '500px',
      data: house,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.loadListings();
      }
    });
  }

  toggleListingStatus(house: HousingLocation): void {
    const isPausing = !house.deleted;
    const actionText = isPausing ? 'pause' : 'reactivate';

    const snackBarRef = this.snackBar.open(
      `Are you sure you want to ${actionText} "${house.name}"?`,
      `Yes, ${actionText.charAt(0).toUpperCase() + actionText.slice(1)}`,
      { duration: 5000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      const payload: Partial<HousingLocation> = {
        deleted: isPausing,
        deletedAt: isPausing ? new Date().toISOString() : undefined,
        deletedBy: isPausing ? this.userId : undefined,
        updatedAt: new Date().toISOString(),
        editedBy: this.userId,
      };

      this.housingService
        .updateHousingLocation(house.id, payload)
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: () => {
            this.snackBar.open(
              `✅ Listing ${actionText}d successfully!`,
              'Close',
              { duration: 3000 }
            );
            this.loadListings();
          },
          error: () => {
            this.snackBar.open(`❌ Error updating listing.`, 'Close', {
              duration: 3000,
            });
          },
        });
    });
  }

  deleteHouse(id: string, name: string): void {
    const snackBarRef = this.snackBar.open(
      `Are you sure you want to delete "${name}"?`,
      'Yes, Delete',
      { duration: 5000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.housingService.deleteHousingLocation(id, this.userId).subscribe({
        next: () => {
          this.snackBar.open('✅ Listing deleted successfully!', 'Close', {
            duration: 3000,
          });
          this.loadListings();
        },
        error: () => {
          this.snackBar.open('❌ Error deleting listing.', 'Close', {
            duration: 3000,
          });
        },
      });
    });
  }

  confirmPermanentDelete(id: string, name: string): void {
    const snackBarRef = this.snackBar.open(
      `Permanently delete "${name}"? This cannot be undone.`,
      'Yes, Delete Forever',
      { duration: 7000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      this.housingService
        .deleteHousingLocationPermanently(id)
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: () => {
            this.snackBar.open('✅ Listing permanently deleted!', 'Close', {
              duration: 3000,
            });
            this.loadListings();
          },
          error: () => {
            this.snackBar.open(
              '❌ Error permanently deleting listing.',
              'Close',
              { duration: 3000 }
            );
          },
        });
    });
  }

  get deletedListings(): HousingLocation[] {
    return this.allListings.filter((listing) => listing.deleted);
  }

  confirmDeleteAll(): void {
    const snackBarRef = this.snackBar.open(
      `Permanently delete all ${this.deletedListings.length} inactive listings? This cannot be undone.`,
      'Yes, Delete All',
      { duration: 7000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      const deleteObservables = this.deletedListings.map((listing) =>
        this.housingService.deleteHousingLocationPermanently(listing.id)
      );

      forkJoin(deleteObservables)
        .pipe(
          finalize(() => {
            this.spinner.hide();
            this.loadListings();
          })
        )
        .subscribe({
          next: () => {
            this.snackBar.open(
              '✅ All inactive listings permanently deleted!',
              'Close',
              { duration: 3000 }
            );
          },
          error: () => {
            this.snackBar.open(
              '❌ An error occurred while deleting listings.',
              'Close',
              { duration: 3000 }
            );
          },
        });
    });
  }
}
