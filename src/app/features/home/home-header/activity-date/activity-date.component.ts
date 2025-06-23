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
import { NotificationService } from '../../../../core/services/notification.service';

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
  // Mantenha a lista original se precisar dela em outro lugar
  applications: Array<Application & { photoUrl?: string }> = [];
  // Crie as duas novas listas para a UI
  upcomingApplications: Array<Application & { photoUrl?: string }> = [];
  expiredApplications: Array<Application & { photoUrl?: string }> = [];

  currentUserId: string | null = null;
  isLoading: boolean = false;

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
    private spinner: NgxSpinnerService,
    private notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserId = user?.id ?? null;

    if (!this.currentUserId) {
      return;
    }

    this.loadApplications();

    // 2. ADICIONAR A CHAMADA PARA O MÉTODO DE LIMPEZA
    // Esta linha executa a limpeza da notificação.
    this.notificationService.clearNotifications();
  }

  loadApplications(): void {
    if (!this.currentUserId) {
      return;
    }
    this.isLoading = true;
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
                photoUrl: location.photo || 'path/to/default/image.png',
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
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (appsCompletas) => {
          this.applications = appsCompletas;
          this.sortApplications(appsCompletas); // Chama o novo método de separação
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Falha ao buscar as aplicações do usuário', err);
          this.snackBar.open('❌ Failed to load applications.', 'Close', {
            duration: 3000,
          });
          this.isLoading = false;
        },
      });
  }

  sortApplications(apps: Array<Application & { photoUrl?: string }>): void {
    const now = new Date(); // Usa a data e hora atuais para a comparação

    this.upcomingApplications = [];
    this.expiredApplications = [];

    apps.forEach((app) => {
      // Para aluguéis, a lógica de expiração baseada apenas no dia de check-in está correta.
      if (app.typeOfBusiness === 'rent') {
        const checkInDateStr = app.checkInDate;
        if (!checkInDateStr) {
          this.upcomingApplications.push(app);
          return;
        }
        const todayDateOnly = new Date();
        todayDateOnly.setHours(0, 0, 0, 0);
        const dateParts = checkInDateStr
          .split('-')
          .map((part) => parseInt(part, 10));
        const checkInDate = new Date(
          dateParts[0],
          dateParts[1] - 1,
          dateParts[2]
        );

        if (checkInDate < todayDateOnly) {
          this.expiredApplications.push(app);
        } else {
          this.upcomingApplications.push(app);
        }
      }
      // Para visitas, precisamos comparar a data e a hora.
      else if (app.typeOfBusiness === 'sell') {
        const visitDateStr = app.visitDate;
        const visitTimeStr = app.visitTime;

        if (!visitDateStr || !visitTimeStr) {
          this.upcomingApplications.push(app); // Dados incompletos, assume como futuro.
          return;
        }

        // Combina a data e a hora para criar um objeto Date preciso para a visita.
        const visitDateTime = new Date(`${visitDateStr}T${visitTimeStr}`);

        if (visitDateTime < now) {
          this.expiredApplications.push(app); // A hora da visita já passou.
        } else {
          this.upcomingApplications.push(app); // A visita ainda vai acontecer.
        }
      }
    });
  }

  clearAllExpired(): void {
    if (this.expiredApplications.length === 0) return;

    const snackBarRef = this.snackBar.open(
      `Delete all ${this.expiredApplications.length} expired applications? This action cannot be undone.`,
      'Yes, Delete All',
      { duration: 7000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      const deleteObservables = this.expiredApplications.map((app) =>
        this.applicationService.delete(app.id)
      );

      forkJoin(deleteObservables)
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: () => {
            this.snackBar.open(
              '✅ All expired applications have been deleted.',
              'Close',
              { duration: 3000 }
            );
            this.expiredApplications = []; // Limpa a lista na UI
          },
          error: (err) => {
            console.error('Failed to delete all expired applications', err);
            this.snackBar.open(
              '❌ An error occurred while deleting applications.',
              'Close',
              { duration: 3000 }
            );
          },
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
    this.spinner.show();
    this.applicationService
      .delete(app.id)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe(() => {
        this.snackBar.open('✅ Application deleted!', '', { duration: 2000 });
        this.loadApplications(); // <-- ADICIONE ESTA LINHA
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
    const dialogRef = this.dialog.open(ActivityDateModalComponent, {
      width: '600px',
      data: {
        ...application,
        visitHours: this.visitHoursArray,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedApplicationData = {
          ...application,
          ...result,
        };
        this.spinner.show();
        this.applicationService
          .update(updatedApplicationData.id, updatedApplicationData)
          .pipe(finalize(() => this.spinner.hide()))
          .subscribe({
            next: () => {
              this.snackBar.open(
                '✅ Application updated successfully!',
                'Close',
                { duration: 3000 }
              );
              // A chamada já existe aqui, o que é ótimo!
              this.loadApplications();
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
