import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import {
  FormBuilder,
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
import {
  MatOptionModule,
  provideNativeDateAdapter,
  MAT_DATE_LOCALE,
  MAT_DATE_FORMATS,
} from '@angular/material/core';
import { User } from '../../../../../core/interfaces/user.interface';
import { ReviewsComponent } from './reviews/reviews.component';
import { switchMap } from 'rxjs/operators';
import { EMPTY } from 'rxjs';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { provideNgxMask } from 'ngx-mask';
import { Subscription } from 'rxjs';
import { startWith } from 'rxjs/operators';

declare const L: any;

// 2. Defina o formato de data personalizado
export const APP_DATE_FORMATS = {
  parse: {
    dateInput: 'L',
  },
  display: {
    dateInput: { year: 'numeric', month: '2-digit', day: '2-digit' },
    monthYearLabel: { year: 'numeric', month: 'short' },
    dateA11yLabel: { year: 'numeric', month: 'long', day: 'numeric' },
    monthYearA11yLabel: { year: 'numeric', month: 'long' },
  },
};

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
  providers: [
    provideNativeDateAdapter(),
    provideNgxMask(),
    { provide: MAT_DATE_LOCALE, useValue: 'pt-BR' },
    // 3. Forneça o formato personalizado
    { provide: MAT_DATE_FORMATS, useValue: APP_DATE_FORMATS },
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit, OnDestroy {
  // --- Injeção de Dependências ---
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly housingService = inject(HousingService);
  private readonly applicationService = inject(ApplicationService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly fb = inject(FormBuilder);
  readonly spinner = inject(NgxSpinnerService);

  // --- Propriedades da Classe ---
  housingLocation: HousingLocation | undefined;
  private map!: any;
  applyForm: FormGroup; // A definição será movida para o construtor
  currentUser: User | null = JSON.parse(
    localStorage.getItem('currentUser') || 'null'
  );
  today = new Date();
  availableVisitDays: number[] = [];
  availableVisitTimes: string[] = [];
  availableCheckInDates: string[] = []; // 1. DECLARE a propriedade aqui
  private dateChangeSub: Subscription | undefined;

  constructor() {
    // Inicializa o formulário aqui, usando o FormBuilder injetado
    this.applyForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      location: ['', Validators.required],
      rentDateRange: this.fb.group({
        checkInDate: [null],
        checkOutDate: [null],
      }),
      visitDate: [null],
      visitTime: [null],
    });
  }

  ngOnInit(): void {
    this.spinner.show();
    this.route.params
      .pipe(
        switchMap((params) => {
          const housingLocationId = params['id']; // Mantém como string
          if (!housingLocationId) {
            this.router.navigateByUrl('/');
            return EMPTY;
          }
          // Passa a string diretamente para o serviço
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

    // Apenas esta chamada deve existir para a lógica de data
    this.subscribeToDateChanges();
  }

  ngOnDestroy(): void {
    this.dateChangeSub?.unsubscribe();
  }

  buildApplyForm(): void {
    this.applyForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      location: ['', Validators.required],
      // Agrupa as datas de aluguel em um FormGroup
      rentDateRange: this.fb.group({
        checkInDate: [null, Validators.required],
        checkOutDate: [null, Validators.required],
      }),
      visitDate: [null],
      visitTime: [null],
    });
  }

  private subscribeToDateChanges(): void {
    const visitDateControl = this.applyForm.get('visitDate');
    if (visitDateControl) {
      this.dateChangeSub = visitDateControl.valueChanges
        .pipe(
          // startWith garante que a lógica rode no carregamento inicial
          startWith(visitDateControl.value)
        )
        .subscribe((value: string | Date | null) => {
          // O valor pode vir como string ou Date, então normalizamos para Date
          const selectedDate = value ? new Date(value) : null;
          this.updateVisitTimes(selectedDate);
        });
    }
  }

  /**
   * Atualiza a lista de horários de visita disponíveis com base na data selecionada.
   * Substitua o método onVisitDateChange anterior por este.
   */
  updateVisitTimes(selectedDate: Date | null): void {
    // Reseta a seleção de tempo sempre que a data muda
    this.applyForm.get('visitTime')?.reset();
    this.availableVisitTimes = []; // Limpa a lista de horários

    if (
      !selectedDate ||
      isNaN(selectedDate.getTime()) ||
      !this.housingLocation?.visitAvailability
    ) {
      return;
    }

    // Mapeia o dia da semana para o nome usado no objeto de disponibilidade
    const dayName = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ][selectedDate.getDay()];

    // Constrói a chave correta para acessar os horários (ex: 'mondayTimes')
    const timesKey = (dayName +
      'Times') as keyof typeof this.housingLocation.visitAvailability;

    // Busca os horários usando a chave correta
    const times = this.housingLocation.visitAvailability[timesKey];

    if (Array.isArray(times)) {
      this.availableVisitTimes = times;
    }
  }

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
      const nameParts = this.currentUser.name.split(' ');
      this.applyForm.patchValue({
        firstName: nameParts[0] || '',
        lastName: nameParts.slice(1).join(' ') || '',
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        location: this.currentUser.location,
      });
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

      // Limpa a lista de dias disponíveis antes de recalcular
      this.availableVisitDays = [];

      // Itera sobre as chaves do mapa de dias para verificar a disponibilidade
      for (const dayName in dayMap) {
        const timesKey = (dayName +
          'Times') as keyof typeof location.visitAvailability;
        const times = location.visitAvailability[timesKey];

        // Verifica se a chave de horários existe e se é um array com itens
        if (Array.isArray(times) && times.length > 0) {
          this.availableVisitDays.push(dayMap[dayName]);
        }
      }
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
    if (!d) {
      return false;
    }
    const dateString = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(
      2,
      '0'
    )}-${String(d.getDate()).padStart(2, '0')}`;
    return this.availableCheckInDates.includes(dateString);
  };

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
          name: `${this.applyForm.value.firstName} ${this.applyForm.value.lastName}`,
          email: this.applyForm.value.email,
          phone: this.applyForm.value.phone,
          location: this.applyForm.value.location,
          visitDate: this.applyForm.value.visitDate || undefined,
          visitTime: this.applyForm.value.visitTime || undefined,
          checkInDate:
            this.applyForm.value.rentDateRange?.checkInDate || undefined,
          checkOutDate:
            this.applyForm.value.rentDateRange?.checkOutDate || undefined,
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

  getHousingLocation(): void {
    const housingLocationId = this.route.snapshot.params['id']; // Remova a conversão Number()
    this.housingService
      .getHousingLocationById(housingLocationId)
      .subscribe((location) => {
        if (!location) {
          this.router.navigateByUrl('/');
          return;
        }
        this.housingLocation = location;
        this.processAvailability(location);
        this.setupConditionalValidators();
        this.patchUserForm();
        this.initMap();
      });
  }
}
