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
  [x: string]: any;
  applications: Array<Application & { photoUrl?: string }> = [];
  currentUserId: string | null = null;

  constructor(
    private applicationService: ApplicationService,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private dialog: MatDialog,
    private spinner: NgxSpinnerService
  ) {}

  // Dentro da classe ActivityDateComponent

  ngOnInit(): void {
    this.spinner.show(); // 1. Mostra o spinner no início

    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserId = user?.id ?? null;

    if (!this.currentUserId) {
      this.spinner.hide();
      return;
    }

    this.applicationService
      .getByUser(this.currentUserId)
      .pipe(
        // 2. `switchMap` pega a lista de 'apps' e a transforma em um novo Observable
        switchMap((apps) => {
          // Se a lista de apps estiver vazia, retorna um Observable com um array vazio imediatamente
          if (apps.length === 0) {
            return of([]);
          }

          // Para cada aplicação, cria um Observable que busca a foto correspondente
          const observablesComFoto = apps.map((app) =>
            this.housingService.getHousingLocationById(app.houseId).pipe(
              // `map` transforma o resultado (location) para o formato que queremos:
              // a aplicação original com a nova propriedade `photoUrl`.
              map((location) => ({
                ...app, // Copia a aplicação original
                photoUrl: location.photo || location.photo, // Adiciona a URL da foto
              })),
              // `catchError` garante que se UMA foto falhar, ela não quebre TODAS as outras.
              // Retornamos a aplicação sem foto em caso de erro.
              catchError(() =>
                of({ ...app, photoUrl: 'path/to/default/image.png' })
              )
            )
          );

          // 3. `forkJoin` espera TODAS as buscas de foto terminarem
          return forkJoin(observablesComFoto);
        }),
        // 4. `finalize` é GARANTIDO que será executado no final, com sucesso OU erro.
        // É o lugar perfeito para esconder o spinner.
        finalize(() => this.spinner.hide())
      )
      .subscribe({
        next: (appsCompletas) => {
          // 5. O subscribe agora recebe a lista final, já com as fotos.
          this.applications = appsCompletas;
        },
        error: (err) => {
          // 6. Um erro na primeira chamada (getByUser) é tratado aqui.
          // O `finalize` acima ainda garantirá que o spinner seja escondido.
          console.error('Falha ao buscar as aplicações do usuário', err);
          this.snackBar.open('❌ Failed to load applications.', 'Close', {
            duration: 3000,
          });
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

  openEditApplication(app: Application): void {
    const dialogRef = this.dialog.open(ActivityDateModalComponent, {
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

  trackByApplicationId(index: number, app: Application): string {
    return app.id;
  }
}
