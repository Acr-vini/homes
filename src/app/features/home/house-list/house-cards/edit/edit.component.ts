import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { City, State, IState } from 'country-state-city';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { map, Observable, startWith, finalize } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-edit',
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
  ],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit {
  form!: FormGroup;
  housingLocation!: HousingLocation;
  imagePreview: string | null = null;

  stateControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  cityControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  allStates: IState[] = State.getStatesOfCountry('US');
  allCities: string[] = [];

  filteredStates!: Observable<IState[]>;
  filteredCities!: Observable<string[]>;

  currentUserRole: string | null = null;
  canPerformActions = false;

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
    // Verifica se o formulário já foi inicializado para evitar erros
    if (!this.form) {
      return 'Price (USD)';
    }
    const type = this.form.get('typeOfBusiness')?.value;
    return type === 'rent' ? 'Price per day (USD)' : 'Price (USD)';
  }

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private spinner: NgxSpinnerService,
    @Optional() public dialogRef?: MatDialogRef<EditComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    const houseId = this.data?.id;

    if (!houseId) {
      this.router.navigateByUrl('/');
      return;
    }

    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserRole = user?.role || null;

    this.housingService.getHousingLocationById(houseId).subscribe({
      next: (house) => {
        if (!house) {
          this.router.navigateByUrl('/');
          return;
        }
        this.housingLocation = house;
        this.imagePreview = house.photo ?? null;

        // Lógica de permissão para exibir botões de ação
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const role = user?.role || null;
        const userId = String(user?.id); // Garante que o ID seja string para comparação

        if (role === 'Admin' || role === 'Manager') {
          this.canPerformActions = true;
        } else if (
          (role === 'Owner' || role === 'Real Estate Agency') &&
          house.ownerId === userId
        ) {
          this.canPerformActions = true;
        } else {
          this.canPerformActions = false;
          this.snackBar.open(
            'You do not have permission to edit this property.',
            'Close',
            { duration: 4000 }
          );
          this.onCancel(); // Fecha o dialog ou redireciona
        }

        const stateName = this._findStateName(house.state); // Tenta encontrar o nome do estado a partir do código.
        this.stateControl.setValue(stateName || ''); // Se não encontrar, deixa o campo em branco.

        // Carrega as cidades apenas se o estado for válido.
        if (stateName) {
          this.allCities = City.getCitiesOfState('US', house.state).map(
            (c) => c.name
          );
          this.cityControl.setValue(house.city || '');
        } else {
          this.allCities = []; // Se o estado for inválido, a lista de cidades fica vazia.
          this.cityControl.setValue(''); // E o campo de cidade também.
        }

        this._initializeForm(house);
      },
      error: () => {
        this.spinner.hide();
        this.router.navigateByUrl('/');
      },
    });
  }

  private _initializeForm(house: HousingLocation): void {
    this.form = this.fb.group({
      name: [house.name || '', Validators.required],
      state: this.stateControl,
      city: this.cityControl,
      availableUnits: [
        house.availableUnits || 0,
        [Validators.required, Validators.min(1)],
      ],
      photo: [house.photo || ''],
      wifi: [house.wifi || false],
      laundry: [house.laundry || false],
      typeOfBusiness: [house.typeOfBusiness, Validators.required],
      propertyType: [house.propertyType, Validators.required],
      // O preço agora é carregado corretamente a partir dos dados da casa.
      price: [house.price || 0, [Validators.required, Validators.min(1)]],
    });

    this._setupFilters();
    this.spinner.hide();
  }

  onSubmit(): void {
    if (!this.housingLocation) {
      this.snackBar.open('Cannot save, house data is not available.', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.spinner.show();

    const stateName = this.stateControl.value;
    const stateIsoCode = this._findStateIso(stateName);

    if (!stateIsoCode) {
      this.snackBar.open(
        'Invalid state selected. Please choose from the list.',
        'Close',
        { duration: 3000 }
      );
      this.spinner.hide();
      return;
    }

    const formValues = this.form.getRawValue();
    const currentUserId = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    )?.id;

    const updatedHouseData: Partial<HousingLocation> = {
      ...formValues,
      state: stateIsoCode,
      city: this.cityControl.value,
      price: Number(formValues.price),
      editedBy: currentUserId,
      updatedAt: new Date().toISOString(),
    };

    // Se a casa estava deletada, reativa ela ao salvar
    if (this.housingLocation.deleted) {
      updatedHouseData.deleted = false;
      updatedHouseData.deletedAt = undefined;
      updatedHouseData.deletedBy = undefined;
    }

    this.housingService
      .updateHousingLocation(this.housingLocation.id, updatedHouseData)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ House updated successfully!', 'Close', {
            duration: 3000,
          });
          if (this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.router.navigateByUrl('/');
          }
        },
        error: (err) => {
          console.error('Failed to update house', err);
          this.snackBar.open(
            '❌ An error occurred while updating the house.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
  }

  onDelete(): void {
    if (!this.housingLocation) {
      this.snackBar.open(
        'Cannot delete, house data is not available.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this house?',
      'Yes',
      { duration: 5000 }
    );
    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      const currentUserId = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      )?.id;
      if (!currentUserId) {
        this.snackBar.open('❌ User not identified for deletion.', 'Close', {
          duration: 3000,
        });
        this.spinner.hide();
        return;
      }
      this.housingService
        .deleteHousingLocation(this.housingLocation.id, currentUserId)
        .subscribe({
          next: () => {
            this.snackBar.open('✅ House marked as deleted!', 'Close', {
              duration: 3000,
            });
            this.spinner.hide();

            this.housingService.notifyHouseListUpdated();

            if (this.dialogRef) {
              this.dialogRef.close(true);
            } else {
              this.router.navigateByUrl('/');
            }
          },
          error: () => {
            this.snackBar.open('❌ Failed to delete the house.', 'Close', {
              duration: 3000,
            });
            this.spinner.hide();
          },
        });
    });
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close(false);
    } else {
      this.router.navigateByUrl('/');
    }
  }

  private _setupFilters(): void {
    this.filteredStates = this.stateControl.valueChanges.pipe(
      startWith<string>(this.stateControl.value),
      map((val: string) => this._filterStates(val))
    );

    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith<string>(this.cityControl.value || ''),
      map((value: string) => this._filterCities(value))
    );

    this.stateControl.valueChanges.subscribe((stateName: string) => {
      const iso = this._findStateIso(stateName);
      // Atualiza a fonte de dados para as cidades.
      this.allCities = iso
        ? City.getCitiesOfState('US', iso).map((c) => c.name)
        : [];
      // Reseta o campo da cidade, forçando o usuário a escolher uma nova.
      this.cityControl.setValue('');
    });
  }

  private _filterStates(value: string): IState[] {
    const filter = value.toLowerCase();
    return this.allStates.filter((s) => s.name.toLowerCase().includes(filter));
  }

  private _filterCities(value: string): string[] {
    const filter = value.toLowerCase();
    return this.allCities.filter((c) => c.toLowerCase().includes(filter));
  }

  private _findStateIso(name: string): string | undefined {
    return this.allStates.find((s) => s.name === name)?.isoCode;
  }

  private _findStateName(iso: string): string | undefined {
    return this.allStates.find((s) => s.isoCode === iso)?.name;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        // FIX: Garante que o resultado seja tratado como string
        this.imagePreview = reader.result as string;
        this.form.patchValue({
          photo: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  trackByStateId(index: number, state: IState): string {
    return state.isoCode;
  }

  trackByCityId(index: number, city: string): string {
    return city;
  }

  onSave(): void {
    if (
      this.form.invalid ||
      this.stateControl.invalid ||
      this.cityControl.invalid
    ) {
      this.snackBar.open(
        '❌ Please fill all required fields correctly.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    this.spinner.show();

    const formValues = this.form.getRawValue();
    const stateIsoCode = this._findStateIso(this.stateControl.value) || '';
    const currentUserId = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    )?.id;

    const updatedHouseData: Partial<HousingLocation> = {
      ...formValues,
      state: stateIsoCode,
      city: this.cityControl.value,
      price: Number(formValues.price),
      editedBy: currentUserId,
      updatedAt: new Date().toISOString(),
    };

    // Se a casa estava deletada, reativa ela ao salvar
    if (this.housingLocation.deleted) {
      updatedHouseData.deleted = false;
      updatedHouseData.deletedAt = undefined;
      updatedHouseData.deletedBy = undefined;
    }

    this.housingService
      .updateHousingLocation(this.housingLocation.id, updatedHouseData)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ House updated successfully!', 'Close', {
            duration: 3000,
          });
          this.dialogRef?.close(true);
        },
        error: (err) => {
          console.error('Error updating house:', err);
          this.snackBar.open('❌ Error updating house.', 'Close', {
            duration: 3000,
          });
        },
      });
  }
}
