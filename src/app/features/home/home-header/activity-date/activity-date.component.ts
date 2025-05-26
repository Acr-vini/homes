import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgModule } from '@angular/core';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule } from 'ngx-spinner';
import {
  ApplicationService,
  Application,
} from '../../../../core/services/application.service';
import { HousingService } from '../../../../core/services/housing.service';
import { DetailsModalAplicationComponent } from './activity-date-modal/activity-date-modal.component';
import { MatDialog } from '@angular/material/dialog';

@Component({
  selector: 'app-activity-date',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
    NgxSpinnerModule,
  ],
  templateUrl: './activity-date.component.html',
  styleUrls: ['./activity-date.component.scss'],
})
export class ActivityDateComponent implements OnInit {
  applications: Array<Application & { photoUrl?: string }> = [];
  currentUserId: string | null = null;
  loading = false;

  constructor(
    private applicationService: ApplicationService,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    this.loading = true;
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserId = user?.id ?? null;
    if (!this.currentUserId) {
      this.loading = false;
      return;
    }

    this.applications = this.applicationService.getByUser(this.currentUserId);

    let pending = this.applications.length;
    if (pending === 0) this.loading = false;

    this.applications.forEach((app) => {
      this.housingService
        .getHousingLocationById(app.houseId)
        .subscribe((location) => {
          app.photoUrl = location.imageUrl || location.photo;
          pending--;
          if (pending === 0) this.loading = false;
        });
    });
  }

  viewDetails(app: Application): void {
    this.router.navigate(['/details-application'], {
      state: { ...app },
    });
  }

  confirmDeleteApplication(app: Application): void {
    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this application?',
      'Yes',
      { duration: 5000 }
    );
    snackBarRef.onAction().subscribe(() => {
      this.deleteApplication(app);
    });
  }

  confirmCancelApplication(app: Application): void {
    const snackBarRef = this.snackBar.open(
      'Are you sure you want to cancel this visit or stay?',
      'Yes',
      { duration: 5000 }
    );
    snackBarRef.onAction().subscribe(() => {
      this.cancelApplication(app);
    });
  }

  deleteApplication(app: Application): void {
    this.loading = true;
    this.applicationService.delete(app.id).subscribe(() => {
      this.applications = this.applications.filter((a) => a.id !== app.id);
      this.loading = false;
      this.snackBar.open('✅ Application deleted!', '', { duration: 2000 });
    });
  }

  cancelApplication(app: Application): void {
    this.loading = true;
    if (app.typeOfBusiness === 'sell') {
      app.visitDate = '';
      app.visitTime = '';
    } else {
      app.checkInDate = '';
      app.checkOutDate = '';
    }
    this.applicationService.update(app.id, app).subscribe(() => {
      this.loading = false;
      this.snackBar.open('✅ Visit or stay canceled!', '', { duration: 2000 });
    });
  }

  openEditApplication(app: Application): void {
    const dialogRef = this.dialog.open(DetailsModalAplicationComponent, {
      data: app,
      width: '500px',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Atualize a aplicação com os novos dados
        this.applicationService
          .update(app.id, { ...app, ...result })
          .subscribe(() => {
            // Atualize a lista local se necessário
            Object.assign(app, result);
            this.snackBar.open('✅ Application updated!', '', {
              duration: 2000,
            });
          });
      }
    });
  }
}
