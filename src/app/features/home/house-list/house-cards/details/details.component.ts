import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms'; // Adicionado Validators
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationService } from '../../../../../core/services/application.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner'; // Adicionado NgxSpinnerService
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { User } from '../../../../../core/interfaces/user.interface';
import { ReviewsComponent } from './reviews/reviews.component';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
    NgxSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    MatOptionModule,
    ReviewsComponent,
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  // SECTION: Properties and Injections
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  housingService = inject(HousingService);
  applicationService = inject(ApplicationService);
  snackBar = inject(MatSnackBar);
  spinner = inject(NgxSpinnerService); // Injetar NgxSpinnerService

  housingLocation: HousingLocation | undefined;

  applyForm = new FormGroup({
    name: new FormControl('', Validators.required), // Adicionado Validators.required
    email: new FormControl('', [Validators.required, Validators.email]), // Adicionado Validators.required
    visitDate: new FormControl(''), // Validadores serão adicionados dinamicamente
    visitTime: new FormControl(''), // Validadores serão adicionados dinamicamente
    checkInDate: new FormControl(''), // Validadores serão adicionados dinamicamente
    checkOutDate: new FormControl(''), // Validadores serão adicionados dinamicamente
    phone: new FormControl('', Validators.required), // Adicionado Validators.required
    location: new FormControl('', Validators.required), // Adicionado Validators.required
  });

  currentUser: User | null = JSON.parse(
    localStorage.getItem('currentUser') || 'null'
  );
  today = new Date().toISOString().split('T')[0];

  visitHours = [
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

  // SECTION: Lifecycle Hooks
  constructor() {
    this.spinner.show(); // Mostrar spinner antes de carregar os dados
    const housingLocationId = String(this.route.snapshot.paramMap.get('id'));
    if (!housingLocationId) {
      console.error('ID inválido:', housingLocationId);
      this.router.navigateByUrl('/');
      this.spinner.hide(); // Esconder spinner se houver erro de ID
      return;
    }

    this.housingService.getHousingLocationById(housingLocationId).subscribe({
      next: (location) => {
        this.housingLocation = location;
        this.setupConditionalValidators(); // Configurar validadores após carregar housingLocation
        this.spinner.hide(); // Esconder spinner após carregar com sucesso
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da casa:', err);
        this.router.navigateByUrl('/');
        this.spinner.hide(); // Esconder spinner em caso de erro
      },
    });
  }

  ngOnInit(): void {
    if (this.currentUser) {
      this.applyForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        location: this.currentUser.location,
      });
    }
  }

  // Adicionar novo método para configurar validadores condicionais
  setupConditionalValidators(): void {
    if (!this.housingLocation) return;

    // Limpar validadores anteriores para os campos de data/hora
    this.applyForm.get('visitDate')?.clearValidators();
    this.applyForm.get('visitTime')?.clearValidators();
    this.applyForm.get('checkInDate')?.clearValidators();
    this.applyForm.get('checkOutDate')?.clearValidators();

    if (this.housingLocation.typeOfBusiness === 'sell') {
      this.applyForm.get('visitDate')?.setValidators(Validators.required);
      this.applyForm.get('visitTime')?.setValidators(Validators.required);
    } else if (this.housingLocation.typeOfBusiness === 'rent') {
      this.applyForm.get('checkInDate')?.setValidators(Validators.required);
      this.applyForm.get('checkOutDate')?.setValidators(Validators.required);
    }

    // Atualizar o estado de validade dos controles
    this.applyForm.get('visitDate')?.updateValueAndValidity();
    this.applyForm.get('visitTime')?.updateValueAndValidity();
    this.applyForm.get('checkInDate')?.updateValueAndValidity();
    this.applyForm.get('checkOutDate')?.updateValueAndValidity();
  }

  submitApplication(): void {
    if (this.applyForm.invalid) {
      // Verificar se o formulário é inválido primeiro
      this.snackBar.open(
        'Please fill all required fields correctly.',
        'Close',
        {
          duration: 3000,
        }
      );
      // Marcar todos os campos como tocados para exibir mensagens de erro
      this.applyForm.markAllAsTouched();
      return;
    }
    if (this.housingLocation) {
      // housingLocation deve existir para submeter
      // Adicionada verificação para this.housingLocation
      const snackBarRefConfirm = this.snackBar.open(
        'Are you sure you want to apply?',
        'Yes',
        { duration: 7000 } // Aumentar duração para dar tempo de clicar
      );

      snackBarRefConfirm.onAction().subscribe(() => {
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        if (!user || !user.id) {
          this.snackBar.open('User not identified. Please log in.', 'Close', {
            duration: 3000,
          });
          return;
        }

        const newApplicationPayload = {
          userId: user.id,
          houseId: this.housingLocation!.id, // Usar ! pois já verificamos housingLocation
          typeOfBusiness: this.housingLocation!.typeOfBusiness,
          houseName: this.housingLocation!.name,
          city: this.housingLocation!.city,
          state: this.housingLocation!.state,
          // Adicionar os campos do formulário que são relevantes para a aplicação
          name: this.applyForm.value.name,
          email: this.applyForm.value.email,
          phone: this.applyForm.value.phone,
          location: this.applyForm.value.location,
          visitDate: this.applyForm.value.visitDate || undefined,
          visitTime: this.applyForm.value.visitTime || undefined,
          checkInDate: this.applyForm.value.checkInDate || undefined,
          checkOutDate: this.applyForm.value.checkOutDate || undefined,
          timestamp: new Date().toISOString(),
        };

        this.applicationService.add(newApplicationPayload).subscribe({
          next: (addedApplication) => {
            // O serviço add pode retornar a aplicação criada
            let snackBarMessage = `Application for ${newApplicationPayload.houseName} submitted. `;
            if (
              newApplicationPayload.typeOfBusiness === 'sell' &&
              newApplicationPayload.visitDate
            ) {
              snackBarMessage += `Visit on ${
                newApplicationPayload.visitDate
              } at ${newApplicationPayload.visitTime || 'N/A'}.`;
            } else if (
              newApplicationPayload.typeOfBusiness === 'rent' &&
              newApplicationPayload.checkInDate
            ) {
              snackBarMessage += `Stay from ${
                newApplicationPayload.checkInDate
              } to ${newApplicationPayload.checkOutDate || 'N/A'}.`;
            }

            this.snackBar.open(snackBarMessage, 'OK', {
              duration: 7000, // Duração para o usuário ler
            });

            // Navegar para a tela de "activity date"
            // Substitua '/my-activity' pela rota correta se for diferente
            this.router.navigate(['/activity-date']);
          },
          error: (err) => {
            console.error('Failed to add application', err);
            this.snackBar.open('❌ Failed to submit application.', 'Close', {
              duration: 3000,
            });
          },
        });
      });
    } else {
      let errorMessage = 'Please fill all required fields.';
      if (!this.housingLocation) {
        errorMessage = 'Housing details not loaded. Cannot submit application.';
      }
      this.snackBar.open(errorMessage, 'Close', {
        duration: 3000,
      });
    }
  }
}
