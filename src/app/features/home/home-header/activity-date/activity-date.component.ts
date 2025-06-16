import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ApplicationService } from '../../../../core/services/application.service';
import { Application } from '../../../../core/interfaces/application.interface';
import { HousingService } from '../../../../core/services/housing.service';
import { ActivityDateModalComponent } from './activity-date-modal/activity-date-modal.component';
import { MatDialog } from '@angular/material/dialog';
import { Observable, forkJoin, of } from 'rxjs';
import { switchMap, map, finalize, catchError } from 'rxjs/operators';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-activity-date',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    NgxSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  templateUrl: './activity-date.component.html',
  styleUrls: ['./activity-date.component.scss'],
})
export class ActivityDateComponent implements OnInit {
  applications: Array<Application & { photoUrl?: string }> = [];
  currentUserId: string | null = null;
  isLoading: boolean = false; // Adicionar esta flag

  visitHoursArray = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
  ];

  constructor(
    private applicationService: ApplicationService,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserId = user?.id ?? null;

    if (!this.currentUserId) {
      // Não precisa mostrar spinner se não há usuário
      return;
    }
    this.loadApplications(); // Chama o novo método
  }

  loadApplications(): void {
    if (!this.currentUserId) {
      return;
    }
    this.isLoading = true; // Definir como true
    this.spinner.show();
    this.applicationService
      .getByUser(this.currentUserId)
      .pipe(
        switchMap((apps) => {
          if (apps.length === 0) {
            return of([]);
          }
          const observablesComFoto = apps.map((app) =>
            this.housingService.getHousingLocationById(app.houseId).pipe(
              map((location) => ({
                ...app,
                photoUrl: location.photo || 'path/to/default/image.png', // Usar um fallback direto
              })),
              catchError(() =>
                of({ ...app, photoUrl: 'path/to/default/image.png' })
              )
            )
          );
          return forkJoin(observablesComFoto);
        }),
        finalize(() => {
          this.spinner.hide();
          this.isLoading = false; // Definir como false
        })
      )
      .subscribe({
        next: (appsCompletas) => {
          this.applications = appsCompletas;
          this.isLoading = false; // Definir como false
        },
        error: (err) => {
          console.error('Falha ao buscar as aplicações do usuário', err);
          this.snackBar.open('❌ Failed to load applications.', 'Close', {
            duration: 3000,
          });
          this.isLoading = false; // Definir como false
        },
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
    this.spinner.show(); // Mostra o spinner
    this.applicationService.delete(app.id).subscribe(() => {
      this.applications = this.applications.filter((a) => a.id !== app.id);
      this.spinner.hide(); // Esconde o spinner
      this.snackBar.open('✅ Application deleted!', '', { duration: 2000 });
    });
  }

  cancelApplication(app: Application): void {
    if (app.typeOfBusiness === 'sell') {
      app.visitDate = '';
      app.visitTime = '';
    } else {
      app.checkInDate = '';
      app.checkOutDate = '';
    }
    this.applicationService.update(app.id, app).subscribe(() => {
      this.snackBar.open('✅ Visit or stay canceled!', '', { duration: 2000 });
    });
  }

  editApplication(application: any) {
    console.log('Dados da aplicação a serem editados:', application); // ADICIONE ESTE LOG
    const dialogRef = this.dialog.open(ActivityDateModalComponent, {
      width: '600px',
      data: {
        ...application,
        visitHours: this.visitHoursArray, // Certifique-se que visitHoursArray está definido e populado
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        console.log('Modal closed with data:', result);
        const updatedApplicationData = {
          ...application,
          ...result,
        };
        this.spinner.show(); // Mostrar spinner antes da chamada de update
        this.applicationService
          .update(updatedApplicationData.id, updatedApplicationData)
          .pipe(finalize(() => this.spinner.hide())) // Esconder spinner após update
          .subscribe({
            next: () => {
              this.snackBar.open(
                '✅ Application updated successfully!',
                'Close',
                { duration: 3000 }
              );
              this.loadApplications(); // Agora este método existe
            },
            error: (err) => {
              console.error('Error updating application', err);
              this.snackBar.open('❌ Failed to update application.', 'Close', {
                duration: 3000,
              });
            },
          });
      }
    });
  }

  trackByApplicationId(index: number, app: Application): string {
    return app.id;
  }
}
