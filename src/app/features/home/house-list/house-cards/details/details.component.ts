import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import {
  FormBuilder,
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
import * as L from 'leaflet';
import { AvailableTimes } from '../../../../../shared/utils/available-times';

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

  housingLocation: HousingLocation | undefined;
  private map!: L.Map;
  applyForm: FormGroup;
  currentUser: User | null = JSON.parse(
    localStorage.getItem('currentUser') || 'null'
  );
  today = new Date();
  // Adicione estas duas propriedades:
  visitMinDate: Date | null = null;
  visitMaxDate: Date | null = null;
  readonly availableTimes = AvailableTimes; // 2. ADICIONE ESTA PROPRIEDADE

  availableVisitTimes: string[] = [];
  availableCheckInDates: string[] = [];
  private dateChangeSub: Subscription | undefined;

  constructor() {
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
          this.processAvailability(location); // <-- 1. CHAME O NOVO MÉTODO AQUI
          this.setupConditionalValidators();
          this.patchUserForm();
          setTimeout(() => this.initMap(), 0);
          this.spinner.hide();
        },
        error: (err) => {
          console.error('Erro ao carregar detalhes da casa:', err);
          this.spinner.hide();
          this.router.navigateByUrl('/');
        },
      });

    this.subscribeToDateChanges();
  }

  ngOnDestroy(): void {
    this.dateChangeSub?.unsubscribe();
  }

  // 2. ADICIONE ESTE MÉTODO
  processAvailability(location: HousingLocation) {
    if (location.typeOfBusiness === 'sell' && location.visitAvailability) {
      if (location.visitAvailability.startDate) {
        // Converte a string de data para um objeto Date
        this.visitMinDate = new Date(location.visitAvailability.startDate);
      }
      if (location.visitAvailability.endDate) {
        this.visitMaxDate = new Date(location.visitAvailability.endDate);
      }
    }
    // Adicione aqui a lógica para 'rent' se necessário no futuro
  }

  // ADICIONE ESTA FUNÇÃO
  visitDateFilter = (d: Date | null): boolean => {
    if (!d) {
      return false;
    }
    // Garante que a comparação ignore a parte de "hora" da data
    const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const isAfterMin =
      !this.visitMinDate ||
      time >=
        new Date(
          this.visitMinDate.getFullYear(),
          this.visitMinDate.getMonth(),
          this.visitMinDate.getDate()
        ).getTime();
    const isBeforeMax =
      !this.visitMaxDate ||
      time <=
        new Date(
          this.visitMaxDate.getFullYear(),
          this.visitMaxDate.getMonth(),
          this.visitMaxDate.getDate()
        ).getTime();
    return isAfterMin && isBeforeMax;
  };

  buildApplyForm(): void {
    this.applyForm = this.fb.group({
      firstName: ['', Validators.required],
      lastName: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      location: ['', Validators.required],
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
        .pipe(startWith(visitDateControl.value))
        .subscribe((value: string | Date | null) => {
          const selectedDate = value ? new Date(value) : null;
          this.updateVisitTimes(selectedDate);
        });
    }
  }

  updateVisitTimes(selectedDate: Date | null): void {
    this.applyForm.get('visitTime')?.reset();
    this.availableVisitTimes = [];

    if (
      !selectedDate ||
      isNaN(selectedDate.getTime()) ||
      !this.housingLocation?.visitAvailability
    ) {
      return;
    }

    // AQUI ESTÁ A CORREÇÃO:
    const { startTime, endTime } = this.housingLocation.visitAvailability;
    const allTimes = this.availableTimes; // Usando a lista completa de horários

    if (startTime && endTime) {
      const startIndex = allTimes.indexOf(startTime);
      const endIndex = allTimes.indexOf(endTime);

      if (startIndex !== -1 && endIndex !== -1 && startIndex <= endIndex) {
        this.availableVisitTimes = allTimes.slice(startIndex, endIndex + 1);
      }
    }
  }

  private initMap(): void {
    if (
      this.housingLocation &&
      this.housingLocation.latitude &&
      this.housingLocation.longitude
    ) {
      if (this.map) {
        this.map.remove();
      }

      this.map = L.map('map', {}).setView(
        [this.housingLocation.latitude, this.housingLocation.longitude],
        14
      );

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution:
          '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(this.map);

      L.marker([this.housingLocation.latitude, this.housingLocation.longitude])
        .addTo(this.map)
        .bindPopup(`<b>${this.housingLocation.name}</b>`)
        .openPopup();

      this.map.invalidateSize();
    }
  }

  get favoriteKey(): string {
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

  // Adicione esta função de filtro
  visitdateFilter = (d: Date | null): boolean => {
    if (!d) {
      return false;
    }
    // Garante que a comparação ignore a parte de "hora" da data
    const time = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
    const isAfterMin =
      !this.visitMinDate ||
      time >=
        new Date(
          this.visitMinDate.getFullYear(),
          this.visitMinDate.getMonth(),
          this.visitMinDate.getDate()
        ).getTime();
    const isBeforeMax =
      !this.visitMaxDate ||
      time <=
        new Date(
          this.visitMaxDate.getFullYear(),
          this.visitMaxDate.getMonth(),
          this.visitMaxDate.getDate()
        ).getTime();
    return isAfterMin && isBeforeMax;
  };

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

  editHouse(): void {
    if (this.housingLocation?.id) {
      this.router.navigate(['/edit-house', this.housingLocation.id]);
    }
  }

  canEditHouse(): boolean {
    const role = this.currentUser?.role;
    return role === 'admin' || role === 'agent';
  }

  setupConditionalValidators(): void {
    if (!this.housingLocation) return;

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

    this.applyForm.get('visitDate')?.updateValueAndValidity();
    this.applyForm.get('visitTime')?.updateValueAndValidity();
    this.applyForm.get('checkInDate')?.updateValueAndValidity();
    this.applyForm.get('checkOutDate')?.updateValueAndValidity();
  }

  submitApplication(): void {
    if (this.applyForm.invalid) {
      this.snackBar.open(
        'Please fill all required fields correctly.',
        'Close',
        {
          duration: 3000,
        }
      );
      this.applyForm.markAllAsTouched();
      return;
    }
    if (this.housingLocation) {
      const snackBarRefConfirm = this.snackBar.open(
        'Are you sure you want to apply?',
        'Yes',
        { duration: 7000 }
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
    const housingLocationId = this.route.snapshot.params['id'];
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
