import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { forkJoin, of } from 'rxjs';
// CORREÇÃO: Adicionado 'tap' à lista de operadores importados do RxJS
import { switchMap, map, finalize, catchError, tap } from 'rxjs/operators';

import { ApplicationService } from '../../../../core/services/application.service';
import { HousingService } from '../../../../core/services/housing.service';
import { NotificationService } from '../../../../core/services/notification.service';
import { Application } from '../../../../core/interfaces/application.interface';
import { ActivityDateModalComponent } from './activity-date-modal/activity-date-modal.component';

import { AdvertiserRatingService } from '../../../../core/services/advertiser-rating.service';
import { AdvertiserReviewFormComponent } from '../activity-date/advertiser-review-form/advertiser-review-form.component';
import { AdvertiserRating } from '../../../../core/interfaces/advertiser-rating.interface';

// CORREÇÃO: Criado um tipo para o objeto "enriquecido" para clareza e para satisfazer o TypeScript
type EnrichedApplication = Application & {
  photoUrl?: string;
};

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
  // As propriedades agora usam o novo tipo para consistência
  applications: EnrichedApplication[] = [];
  upcomingApplications: EnrichedApplication[] = [];
  expiredApplications: EnrichedApplication[] = [];

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
    private notificationService: NotificationService,
    private advertiserRatingService: AdvertiserRatingService
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserId = user?.id ?? null;

    if (!this.currentUserId) {
      return;
    }

    this.loadApplications();
    this.notificationService.clearNotifications();
  }

  loadApplications(): void {
    if (!this.currentUserId) {
      return;
    }
    this.isLoading = true;
    this.spinner.show();
    console.log('[DEBUG] Iniciando loadApplications...');

    const userApplications$ = this.applicationService.getByUser(
      this.currentUserId
    );
    const userRatings$ = this.advertiserRatingService
      .getRatingsByReviewer(this.currentUserId)
      .pipe(catchError(() => of([])));

    forkJoin({
      apps: userApplications$,
      ratings: userRatings$,
    })
      .pipe(
        tap(({ apps, ratings }) => {
          console.log(
            '[DEBUG] forkJoin inicial COMPLETO. Aplicações recebidas:',
            apps.length,
            'Avaliações recebidas:',
            ratings.length
          );
        }),
        switchMap(
          ({
            apps,
            ratings,
          }: {
            apps: Application[];
            ratings: AdvertiserRating[];
          }) => {
            if (apps.length === 0) {
              console.log(
                '[DEBUG] Nenhuma aplicação encontrada. Encerrando fluxo.'
              );
              return of([]);
            }

            console.log(
              '[DEBUG] Entrando no switchMap para enriquecer os dados...'
            );
            const ratedActivityIds = new Set(
              ratings.map((r) => String(r.activityId))
            );

            const observablesComFoto = apps.map((app) => {
              console.log(
                `[DEBUG] Preparando busca de detalhes para a aplicação ID: ${app.id}, Casa ID: ${app.houseId}`
              );
              return this.housingService
                .getHousingLocationById(app.houseId)
                .pipe(
                  map((location) => {
                    console.log(
                      `[DEBUG] Detalhes da Casa ID ${app.houseId} RECEBIDOS.`
                    );
                    return {
                      ...app,
                      photoUrl:
                        location.photos?.[0] || 'path/to/default/image.png',
                      advertiserId: location.ownerId,
                      advertiserName: location.ownerName || 'Anunciante',
                      hasBeenReviewed: ratedActivityIds.has(String(app.id)),
                    };
                  }),
                  catchError(() => {
                    console.warn(
                      `[DEBUG] ERRO ao buscar detalhes da Casa ID ${app.houseId}. Retornando fallback.`
                    );
                    return of({
                      ...app,
                      photoUrl: 'path/to/default/image.png',
                      hasBeenReviewed: ratedActivityIds.has(String(app.id)),
                    });
                  })
                );
            });

            console.log(
              `[DEBUG] Disparando forkJoin para buscar ${observablesComFoto.length} detalhes de casas...`
            );
            return forkJoin(observablesComFoto);
          }
        ),
        tap((appsCompletas) => {
          console.log(
            '[DEBUG] forkJoin final COMPLETO. Dados enriquecidos:',
            appsCompletas.length
          );
        }),
        finalize(() => {
          console.log(
            '[DEBUG] Operador finalize EXECUTADO. Escondendo o spinner.'
          );
          this.spinner.hide();
          this.isLoading = false;
        })
      )
      .subscribe({
        next: (appsCompletas: any[]) => {
          console.log(
            '[DEBUG] subscribe NEXT EXECUTADO. Ordenando aplicações.'
          );
          this.applications = appsCompletas;
          this.sortApplications(appsCompletas);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('[DEBUG] subscribe ERRO EXECUTADO.', err);
          this.snackBar.open('❌ Failed to load applications.', 'Close', {
            duration: 3000,
          });
          this.isLoading = false;
        },
      });
  }

  // CORREÇÃO: Adicionado tipo explícito ao parâmetro 'apps'
  sortApplications(apps: EnrichedApplication[]): void {
    const now = new Date();
    this.upcomingApplications = [];
    this.expiredApplications = [];

    apps.forEach((app) => {
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
      } else if (app.typeOfBusiness === 'sell') {
        const visitDateStr = app.visitDate;
        const visitTimeStr = app.visitTime;

        if (!visitDateStr || !visitTimeStr) {
          this.upcomingApplications.push(app);
          return;
        }

        const visitDateTime = new Date(`${visitDateStr}T${visitTimeStr}`);

        if (visitDateTime < now) {
          this.expiredApplications.push(app);
        } else {
          this.upcomingApplications.push(app);
        }
      }
    });
  }

  openReviewDialog(app: Application): void {
    const dialogRef = this.dialog.open(AdvertiserReviewFormComponent, {
      width: '500px',
      data: {
        houseName: app.houseName,
        advertiserName: app.advertiserName || 'the advertiser',
      },
      disableClose: true,
      panelClass: 'review-dialog-container',
    });

    dialogRef.afterClosed().subscribe(/* ... */);
  }

  private submitAdvertiserRating(
    app: Application,
    reviewData: { rating: number; comment: string }
  ): void {
    if (!this.currentUserId || !app.advertiserId) {
      this.snackBar.open('❌ User or Advertiser ID is missing.', 'Close', {
        duration: 3000,
      });
      return;
    }

    this.spinner.show();

    const ratingPayload: Omit<AdvertiserRating, 'id' | 'createdAt'> = {
      activityId: app.id,
      reviewerId: this.currentUserId,
      reviewerName: app.name,
      advertiserId: app.advertiserId,
      rating: reviewData.rating,
      comment: reviewData.comment,
    };

    this.advertiserRatingService
      .addRating(ratingPayload)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ Thank you for your feedback!', 'Close', {
            duration: 3000,
          });
          const targetApp = this.expiredApplications.find(
            (a) => a.id === app.id
          );
          if (targetApp) {
            targetApp.hasBeenReviewed = true;
          }
        },
        error: (err) => {
          console.error('Failed to submit rating', err);
          this.snackBar.open(
            '❌ There was an error submitting your review.',
            'Close',
            { duration: 3000 }
          );
        },
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
            this.expiredApplications = [];
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

  deleteApplication(app: Application): void {
    this.spinner.show();
    this.applicationService
      .delete(app.id)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe(() => {
        this.snackBar.open('✅ Application deleted!', '', { duration: 2000 });
        this.loadApplications();
      });
  }

  editApplication(application: any): void {
    const dialogRef = this.dialog.open(ActivityDateModalComponent, {
      width: '600px',
      data: {
        ...application,
        visitHours: this.visitHoursArray,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        const updatedApplicationData = { ...application, ...result };
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
