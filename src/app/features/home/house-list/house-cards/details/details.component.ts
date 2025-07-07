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
} from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationService } from '../../../../../core/services/application.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { User } from '../../../../../core/interfaces/user.interface';
import { ReviewsComponent } from './reviews/reviews.component';
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

declare const L: any;

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
    MatDatepickerModule,
    MatFormFieldModule,
    MatInputModule,
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private housingService = inject(HousingService);
  private applicationService = inject(ApplicationService);
  private snackBar = inject(MatSnackBar);

  spinner = inject(NgxSpinnerService);

  housingLocation: HousingLocation | undefined;
  private map!: any;

  applyForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    visitDate: new FormControl(''),
    visitTime: new FormControl(''),
    checkInDate: new FormControl(''),
    checkOutDate: new FormControl(''),
    phone: new FormControl('', Validators.required),
    location: new FormControl('', Validators.required),
  });

  currentUser: User | null = JSON.parse(
    localStorage.getItem('currentUser') || 'null'
  );
  today = new Date();

  allVisitHours = [
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
  filteredVisitHours: string[] = [];

  availableVisitDays: number[] = [];
  availableVisitTimes: string[] = [];
  availableCheckInDates: string[] = [];

  ngOnInit(): void {
    this.spinner.show();
    this.route.params
      .pipe(
        switchMap((params) => {
          const housingLocationId = params['id'];
          if (!housingLocationId) {
            this.router.navigateByUrl('/');
            return EMPTY;
          }
          return this.housingService.getHousingLocationById(housingLocationId);
        })
      )
      .subscribe({
        next: (location) => {
          if (!location) {
            this.router.navigateByUrl('/');
            return;
          }
          this.housingLocation = location;
          // Processa a disponibilidade assim que os dados chegam
          this.processAvailability(location);
          this.setupConditionalValidators();
          this.patchUserForm();
          this.initMap();
          this.spinner.hide();
        },
        error: (err) => {
          console.error('Erro ao carregar detalhes da casa:', err);
          this.spinner.hide();
          this.router.navigateByUrl('/');
        },
      });

    // Escuta mudanças na data da visita para atualizar os horários disponíveis
    this.applyForm.get('visitDate')?.valueChanges.subscribe((selectedDate) => {
      this.updateAvailableHours(selectedDate);
      // Reseta o horário selecionado quando a data muda
      this.applyForm.get('visitTime')?.reset('');
    });
  }

  // 4. Adicionar a nova função para inicializar o mapa
  private initMap(): void {
    if (
      this.housingLocation &&
      this.housingLocation.latitude &&
      this.housingLocation.longitude
    ) {
      // Previne que o mapa seja inicializado múltiplas vezes
      if (this.map) {
        this.map.remove();
      }

      // Cria o mapa e centraliza nas coordenadas do imóvel
      this.map = L.map('map').setView(
        [this.housingLocation.latitude, this.housingLocation.longitude],
        14
      ); // O '14' é o nível de zoom

      // Adiciona a camada de visualização do mapa (usando OpenStreetMap, que é gratuito)
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      // Adiciona o marcador (pin) no mapa
      L.marker([this.housingLocation.latitude, this.housingLocation.longitude])
        .addTo(this.map)
        .bindPopup(`<b>${this.housingLocation.name}</b>`) // Texto que aparece ao clicar no pin
        .openPopup();
    }
  }

  get favoriteKey(): string {
    // Retorna uma chave única por usuário para o localStorage
    return `favoriteHouses_${this.currentUser?.id}`;
  }

  get favoriteIds(): string[] {
    if (!this.currentUser?.id) return [];
    return JSON.parse(localStorage.getItem(this.favoriteKey) || '[]');
  }

  isFavorited(): boolean {
    if (!this.housingLocation) return false;
    return this.favoriteIds.includes(String(this.housingLocation.id));
  }

  toggleFavorite(): void {
    if (!this.housingLocation || !this.currentUser?.id) return;

    const id = String(this.housingLocation.id);
    let ids = this.favoriteIds;
    const wasFavorited = this.isFavorited();

    if (wasFavorited) {
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
  }

  patchUserForm(): void {
    if (this.currentUser) {
      this.applyForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        location: this.currentUser.location,
      });
    }
  }

  updateAvailableHours(selectedDateStr: string | null): void {
    if (!selectedDateStr) {
      this.filteredVisitHours = [];
      return;
    }

    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    if (selectedDateStr > todayStr) {
      // Se a data selecionada for no futuro, mostra todos os horários.
      this.filteredVisitHours = this.allVisitHours;
    } else if (selectedDateStr === todayStr) {
      // Se a data for hoje, filtra para mostrar apenas os horários futuros.
      const currentHour = now.getHours();
      this.filteredVisitHours = this.allVisitHours.filter((hour) => {
        const hourPart = parseInt(hour.split(':')[0], 10);
        return hourPart > currentHour;
      });
    } else {
      // Data no passado, nenhum horário disponível.
      this.filteredVisitHours = [];
    }
  }

  processAvailability(location: HousingLocation) {
    if (location.typeOfBusiness === 'sell' && location.visitAvailability) {
      const dayMap: { [key: string]: number } = {
        sunday: 0,
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
      };
      this.availableVisitDays = Object.keys(location.visitAvailability)
        .filter((day) => day.includes('Times')) // Apenas dias com horários
        .map((day) => dayMap[day.replace('Times', '')]);
    }
    if (location.typeOfBusiness === 'rent' && location.checkInAvailability) {
      this.availableCheckInDates = location.checkInAvailability;
    }
  }

  // Filtro para o datepicker de 'sell'
  visitDateFilter = (d: Date | null): boolean => {
    const day = (d || new Date()).getDay();
    return this.availableVisitDays.includes(day);
  };

  // Filtro para o datepicker de 'rent'
  checkInDateFilter = (d: Date | null): boolean => {
    if (!d) return false;
    const dateString = d.toISOString().split('T')[0];
    return this.availableCheckInDates.includes(dateString);
  };

  // Atualiza os horários disponíveis quando uma data é selecionada
  onVisitDateChange(event: any) {
    const selectedDate: Date = event.value;
    const dayOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ][selectedDate.getDay()];
    this.availableVisitTimes =
      this.housingLocation?.visitAvailability?.[dayOfWeek + 'Times'] || [];
    this.applyForm.get('visitTime')?.setValue(''); // Reseta o horário
  }

  // ADICIONE ESTE MÉTODO PARA NAVEGAR PARA A PÁGINA DE EDIÇÃO
  editHouse(): void {
    if (this.housingLocation?.id) {
      this.router.navigate(['/edit-house', this.housingLocation.id]);
    }
  }

  canEditHouse(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'agent';
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
          houseId: this.housingLocation!.id,
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
              duration: 7000,
            });

            // Navegar para a tela de "activity date"
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
