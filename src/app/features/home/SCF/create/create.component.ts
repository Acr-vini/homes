import { Component, OnInit, Optional } from '@angular/core';
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
import { Observable, startWith, map } from 'rxjs';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';

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
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  form: FormGroup;
  progress = 0;

  stateControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  cityControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  allStates = State.getStatesOfCountry('US');
  allCities: string[] = [];

  filteredStates!: Observable<{ name: string; isoCode: string }[]>;
  filteredCities!: Observable<string[]>;

  imagePreview: string | ArrayBuffer | null = null;

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
      city: ['', Validators.required],
      state: ['', Validators.required],
      photo: ['', Validators.required],
      availableUnits: [0, Validators.required],
      wifi: [false],
      laundry: [false],
      typeOfBusiness: ['', Validators.required],
      propertyType: ['', Validators.required],
      price: [0, Validators.required],
      ownerId: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    // Filtra estados conforme digita
    this.filteredStates = this.stateControl.valueChanges.pipe(
      startWith(this.stateControl.value),
      map((value) => this._filterStates(value))
    );

    // Ele vai reagir automaticamente às mudanças no `cityControl`.
    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterCities(value))
    );

    // A inscrição em `stateControl` agora só atualiza a lista de cidades e reseta o campo.
    this.stateControl.valueChanges.subscribe((stateName) => {
      const iso = this._findStateIso(stateName);
      // Atualiza a fonte de dados para as cidades.
      this.allCities = iso
        ? City.getCitiesOfState('US', iso).map((c) => c.name)
        : [];
      // Reseta o campo da cidade, forçando o usuário a escolher uma nova.
      this.cityControl.setValue('');
    });

    // Inscreva-se nas mudanças do formulário para calcular o progresso
    this.form.valueChanges.subscribe(() => {
      this.calculateProgress();
    });
  } //Método para calcular o progresso do formulário
  private calculateProgress(): void {
    // Define quais campos são obrigatórios para o progresso
    const requiredControls = [
      'name',
      'state',
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
    // 1. Validação inicial do formulário
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
    const stateName = this.stateControl.value;
    const stateIsoCode = this._findStateIso(stateName);

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

    const payload: Omit<HousingLocation, 'id'> = {
      name: this.form.value.name,
      city: this.cityControl.value,
      state: stateIsoCode,
      photo: this.form.value.photo || (this.imagePreview as string) || '',
      availableUnits: this.form.value.availableUnits,
      wifi: this.form.value.wifi,
      laundry: this.form.value.laundry,
      typeOfBusiness: this.form.value.typeOfBusiness,
      propertyType: this.form.value.propertyType,
      price: this.form.value.price,
      sellerType: currentUser.role,
      createBy: String(currentUser?.id ?? ''),
      editedBy: '',
      deletedBy: '',
      deleted: false,
      ownerId: currentUser.id,
      listedDate: new Date().toISOString(),
    };

    this.housingService.createHousingLocation(payload).subscribe({
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
        this.imagePreview = reader.result;
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
}
