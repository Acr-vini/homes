import { Component, OnInit, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { HousingService } from '../../../../core/services/housing.service';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import { State, City } from 'country-state-city';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map, switchMap, EMPTY } from 'rxjs'; // 1. Importe EMPTY
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { GeocodingService } from '../../../../core/services/geocoding.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatTooltipModule,
    NgxSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  form!: FormGroup;
  imagePreview: string | null = null;
  progress = 0;

  allStates = State.getStatesOfCountry('US');
  allCities: string[] = [];

  filteredStates!: Observable<{ name: string; isoCode: string }[]>;
  filteredCities!: Observable<string[]>;

  residentialPropertyTypes = [
    { value: 'apartment', viewValue: 'Apartment', icon: 'apartment' },
    { value: 'house', viewValue: 'House & Townhouse', icon: 'home' },
    { value: 'condo', viewValue: 'Condo', icon: 'domain' },
    { value: 'studio', viewValue: 'Studio', icon: 'meeting_room' },
    { value: 'flat', viewValue: 'Flat', icon: 'hotel' },
    { value: 'loft', viewValue: 'Loft', icon: 'roofing' },
    { value: 'penthouse', viewValue: 'Penthouse', icon: 'villa' },
    { value: 'farm', viewValue: 'Farm', icon: 'agriculture' },
    { value: 'land', viewValue: 'Land/Lot', icon: 'terrain' },
    { value: 'land_condo', viewValue: 'Land in Condo', icon: 'location_city' },
  ];
  commercialPropertyTypes = [
    { value: 'office', viewValue: 'Office', icon: 'business' },
    {
      value: 'commercial_house',
      viewValue: 'Commercial House',
      icon: 'home_work',
    },
    { value: 'store', viewValue: 'Store', icon: 'store' },
    { value: 'warehouse', viewValue: 'Warehouse', icon: 'inventory' },
    { value: 'commercial_land', viewValue: 'Commercial Land', icon: 'terrain' },
    { value: 'building', viewValue: 'Building', icon: 'apartment' },
    { value: 'garage', viewValue: 'Garage', icon: 'local_parking' },
    { value: 'farm', viewValue: 'Farm', icon: 'agriculture' },
  ];

  // Adicione este getter
  get priceLabel(): string {
    const type = this.form.get('typeOfBusiness')?.value;
    return type === 'rent' ? 'Price per day (USD)' : 'Price (USD)';
  }

  private geocodingService = inject(GeocodingService); // 2. Injete o serviço

  // ADICIONE ESTAS DUAS PROPRIEDADES AQUI
  availableDays = [
    { name: 'Monday', controlName: 'monday' },
    { name: 'Tuesday', controlName: 'tuesday' },
    { name: 'Wednesday', controlName: 'wednesday' },
    { name: 'Thursday', controlName: 'thursday' },
    { name: 'Friday', controlName: 'friday' },
    { name: 'Saturday', controlName: 'saturday' },
    { name: 'Sunday', controlName: 'sunday' },
  ];
  availableTimes = [
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
  ];

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private spinner: NgxSpinnerService,
    @Optional() public dialogRef?: MatDialogRef<CreateComponent>
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      // ADICIONE os campos de state e city aqui
      state: ['', Validators.required],
      city: ['', Validators.required],
      photo: ['', Validators.required],
      availableUnits: [0, Validators.required],
      wifi: [false],
      laundry: [false],
      typeOfBusiness: ['', Validators.required],
      propertyType: ['', Validators.required],
      price: [0, Validators.required],
      ownerId: ['', Validators.required],
      latitude: [0, [Validators.required]],
      longitude: [0, [Validators.required]],

      // ADICIONE OS NOVOS CONTROLES DE HORÁRIO AQUI
      visitStartTime: [null],
      visitEndTime: [null],

      // Novo grupo para disponibilidade de visitas
      visitAvailability: this.fb.group({
        monday: [false],
        mondayTimes: [[]],
        tuesday: [false],
        tuesdayTimes: [[]],
        wednesday: [false],
        wednesdayTimes: [[]],
        thursday: [false],
        thursdayTimes: [[]],
        friday: [false],
        fridayTimes: [[]],
        saturday: [false],
        saturdayTimes: [[]],
        sunday: [false],
        sundayTimes: [[]],
      }),
      // Novos campos para disponibilidade de aluguel
      checkInStart: [null],
      checkInEnd: [null],
      checkInAvailability: [[]],
    });
  }

  ngOnInit(): void {
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );
    if (currentUser) {
      this.form.patchValue({ ownerId: currentUser.id });
    }

    // ATUALIZE para usar os controles do formulário principal
    this.filteredStates = this.form.get('state')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterStates(value || ''))
    );

    this.filteredCities = this.form.get('city')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterCities(value || ''))
    );

    this.form.get('state')!.valueChanges.subscribe((stateName) => {
      const iso = this._findStateIso(stateName);
      this.allCities = iso
        ? City.getCitiesOfState('US', iso).map((c) => c.name)
        : [];
      this.form.get('city')!.setValue('');
    });

    this.form.valueChanges.subscribe(() => {
      this.calculateProgress();
    });
  } //Método para calcular o progresso do formulário
  private calculateProgress(): void {
    const requiredControls = [
      'name',
      'state', // 'state' e 'city' agora fazem parte do form
      'city',
      'availableUnits',
      'typeOfBusiness',
      'photo',
      'propertyType',
      'price',
    ];

    const validControls = requiredControls.filter((controlName) => {
      const control = this.form.get(controlName);
      return control && control.valid;
    });

    const completedFields = validControls.length;
    const totalFields = requiredControls.length; // Calcula a porcentagem e atualiza a propriedade 'progress'

    this.progress = (completedFields / totalFields) * 100;
  }
  private _filterStates(value: string): { name: string; isoCode: string }[] {
    const filter = value.toLowerCase();
    return this.allStates.filter((s) => s.name.toLowerCase().includes(filter));
  }

  private _filterCities(value: string): string[] {
    const filter = value.toLowerCase();
    return this.allCities.filter((c) => c.toLowerCase().includes(filter));
  }

  private _findStateIso(name: string): string | undefined {
    const match = this.allStates.find(
      (s) => s.name.toLowerCase() === name.toLowerCase()
    );
    return match?.isoCode;
  } // Dentro da classe CreateComponent

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open(
        '❌ Please fill all required fields correctly.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.spinner.show();
    const formValues = this.form.getRawValue(); // Obtenha todos os valores de uma vez
    const stateIsoCode = this._findStateIso(formValues.state);

    if (!stateIsoCode) {
      this.snackBar.open(
        '❌ Invalid state selected. Please choose from the list.',
        'Close',
        { duration: 4000 }
      );
      this.spinner.hide();
      return;
    }

    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );

    if (!currentUser) {
      this.snackBar.open(
        '❌ You must be logged in to create a house.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    if (
      currentUser.role !== 'Owner' &&
      currentUser.role !== 'Real Estate Agency'
    ) {
      this.snackBar.open(
        '❌ You do not have permission to create a listing.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    // Chame o serviço de geocodificação com os valores corretos do formulário
    this.geocodingService
      .getCoordinates(formValues.city, formValues.state)
      .pipe(
        switchMap((coordinates) => {
          // 2. Adicione a verificação para o caso de 'coordinates' ser nulo
          if (!coordinates) {
            this.spinner.hide();
            this.snackBar.open(
              '❌ Could not find location. Please check the address.',
              'Close',
              { duration: 4000 }
            );
            return EMPTY; // Interrompe a cadeia de observáveis
          }

          const payload: Omit<HousingLocation, 'id'> = {
            name: formValues.name,
            city: formValues.city,
            state: formValues.state,
            photo: formValues.photo,
            availableUnits: formValues.availableUnits,
            wifi: formValues.wifi,
            laundry: formValues.laundry,
            typeOfBusiness: formValues.typeOfBusiness,
            propertyType: formValues.propertyType,
            price: formValues.price,
            sellerType: formValues.sellerType,
            createBy: String(currentUser?.id ?? ''),
            editedBy: '',
            deletedBy: '',
            deleted: false,
            ownerId: formValues.ownerId,
            listedDate: new Date().toISOString(),
            // Adiciona as coordenadas ao payload
            latitude: coordinates.lat,
            longitude: coordinates.lon, // 3. Corrija 'lng' para 'lon'
          };
          return this.housingService.createHousingLocation(payload);
        })
      )
      .subscribe({
        next: () => {
          this.snackBar.open('✅ House created!', 'Close', { duration: 3000 });
          this.form.reset();
          this.imagePreview = null;
          this.spinner.hide(); // Notifica outros componentes que a lista mudou

          this.housingService.notifyHouseListUpdated();

          if (this.dialogRef) {
            this.dialogRef.close(true); // Fecha o dialog indicando sucesso
          } else {
            this.router.navigate(['/home']);
          }
        },
        error: (err) => {
          this.snackBar.open('❌ Error creating house', 'Close', {
            duration: 3000,
          });
          this.spinner.hide();
          console.error('Create house failed:', err);
        },
      });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.form.get('photo')?.markAsTouched();
    if (input.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        // FIX 2: Garante que o resultado seja tratado como string
        this.imagePreview = reader.result as string;
        this.form.get('photo')?.setValue(reader.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigate(['/']);
    }
  }

  // NOVO MÉTODO PARA APLICAR OS HORÁRIOS
  applyTimesToSelectedDays(): void {
    const startTime = this.form.get('visitStartTime')?.value;
    const endTime = this.form.get('visitEndTime')?.value;

    if (!startTime || !endTime) {
      this.snackBar.open('Please select a start and end time.', 'Close', {
        duration: 3000,
      });
      return;
    }

    // Gera a lista de horários com base no intervalo selecionado
    const startIndex = this.availableTimes.indexOf(startTime);
    const endIndex = this.availableTimes.indexOf(endTime);
    const timeSlots = this.availableTimes.slice(startIndex, endIndex + 1);

    const visitAvailabilityGroup = this.form.get(
      'visitAvailability'
    ) as FormGroup;

    // Itera sobre os dias da semana
    this.availableDays.forEach((day) => {
      const dayControl = visitAvailabilityGroup.get(day.controlName);
      // Se o dia estiver selecionado (checkbox marcado), aplica os horários
      if (dayControl?.value === true) {
        const timeControl = visitAvailabilityGroup.get(
          day.controlName + 'Times'
        );
        timeControl?.setValue(timeSlots);
      }
    });

    this.snackBar.open('✅ Times applied to all selected days!', 'Close', {
      duration: 2000,
    });
  }

  // Métodos para seleção rápida de 'sell'
  selectWeekdays() {
    this.form.get('visitAvailability')?.patchValue({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: false,
      sunday: false,
    });
  }
  selectWeekends() {
    this.form.get('visitAvailability')?.patchValue({
      monday: false,
      tuesday: false,
      wednesday: false,
      thursday: false,
      friday: false,
      saturday: true,
      sunday: true,
    });
  }
  selectAllWeek() {
    this.form.get('visitAvailability')?.patchValue({
      monday: true,
      tuesday: true,
      wednesday: true,
      thursday: true,
      friday: true,
      saturday: true,
      sunday: true,
    });
  }

  // Método para gerar as datas de 'rent'
  updateRentAvailability() {
    const start = this.form.get('checkInStart')?.value;
    const end = this.form.get('checkInEnd')?.value;
    if (start && end) {
      const dates = [];
      let currentDate = new Date(start);
      while (currentDate <= end) {
        dates.push(currentDate.toISOString().split('T')[0]);
        currentDate.setDate(currentDate.getDate() + 1);
      }
      this.form.get('checkInAvailability')?.setValue(dates);
    }
  }
}
