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
import { City, State } from 'country-state-city'; // Apenas State e City para os métodos da biblioteca
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingFormValues } from '../../../../../core/interfaces/housingformvalues.interface';
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
import { map, Observable, startWith } from 'rxjs';
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
  housingLocation!: HousingLocation;
  currentUserRole: string | null = null;

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
    const id = this.data?.id || this.route.snapshot.paramMap.get('id') || '';
    if (!id) {
      this.router.navigateByUrl('/');
      return;
    }

    this.spinner.show();

    this.housingService.getHousingLocationById(id).subscribe({
      next: (house) => {
        this.housingLocation = house;
        this.imagePreview = house.photo ?? null; // CORRIGIDO de imageUrl para photo

        const stateName = this._findStateName(house.state) || house.state || '';
        this.stateControl.setValue(stateName);

        const iso = house.state || '';
        this.allCities = iso
          ? City.getCitiesOfState('US', iso).map((c) => c.name)
          : [];
        this.cityControl.setValue(house.city || '');

        this.form = this.fb.group({
          name: [house.name || '', Validators.required],
          state: this.stateControl,
          city: this.cityControl,
          availableUnits: [
            house.availableUnits || '',
            [Validators.required, Validators.min(1)],
          ],
          photo: [house.photo || ''], // CORRIGIDO de imageUrl para photo
          wifi: [house.wifi || false],
          laundry: [house.laundry || false],
          typeOfBusiness: [house.typeOfBusiness, Validators.required],
        });

        this._setupFilters();
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide(); // Esconde o spinner em caso de erro
        this.router.navigateByUrl('/');
      },
    });

    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserRole = user?.role || null;
  }

  private _setupFilters(): void {
    // Autocomplete para estados
    this.filteredStates = this.stateControl.valueChanges.pipe(
      startWith<string>(this.stateControl.value),
      map((val: string) => this._filterStates(val))
    );

    // Autocomplete para cidades
    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith<string>(this.cityControl.value),
      map((v: string) => this._filterCities(v))
    );

    // Quando estado mudar, recarrega cidades
    this.stateControl.valueChanges.subscribe((val: string) => {
      const iso = this._findStateIso(val);
      this.allCities = iso
        ? City.getCitiesOfState('US', iso).map((c) => c.name)
        : [];
      this.cityControl.setValue('');
      this.filteredCities = this.cityControl.valueChanges.pipe(
        startWith<string>(''),
        map((v2: string) => this._filterCities(v2))
      );
    });
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
        this.imagePreview = reader.result;
        this.form.patchValue({
          // photo: file.name, // Se você quiser guardar o nome do arquivo, crie outro formControl
          photo: reader.result, // CORRIGIDO de imageUrl para photo (para preview e envio)
        });
      };

      reader.readAsDataURL(file);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.housingLocation.id) return;

    this.spinner.show();

    const iso =
      this._findStateIso(this.stateControl.value) || this.housingLocation.state;

    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );

    const payload: HousingLocation = {
      // Tipando o payload para garantir conformidade
      id: this.housingLocation.id,
      name: this.form.value.name,
      city: this.cityControl.value,
      state: iso,
      photo: this.form.value.photo || this.imagePreview || '', // CORRIGIDO de imageUrl para photo
      availableUnits: this.form.value.availableUnits,
      wifi: this.form.value.wifi,
      laundry: this.form.value.laundry,
      typeOfBusiness: this.form.value.typeOfBusiness,
      createBy: this.housingLocation.createBy ?? String(currentUser?.id ?? ''),
      editedBy: String(currentUser?.id ?? ''),
      deletedBy: this.housingLocation.deletedBy ?? '',
      // Adicione createdAt, updatedAt, deletedAt se necessário e se existirem no HousingLocation
      // createdAt: this.housingLocation.createdAt,
      // updatedAt: new Date().toISOString(), // Exemplo para updatedAt
    };

    this.housingService
      .updateHousingLocation(this.housingLocation.id, payload)
      .subscribe({
        next: () => {
          this.snackBar.open('✅ House updated successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.spinner.hide();
          if (this.dialogRef) {
            this.dialogRef.close();
            setTimeout(() => window.location.reload(), 200);
          } else {
            this.router.navigateByUrl('/').then(() => window.location.reload());
          }
        },
        error: () => {
          this.snackBar.open('❌ Failed to update the house.', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });
          this.spinner.hide();
        },
      });
  }

  onDelete(): void {
    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this house?',
      'Yes',
      { duration: 5000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      this.housingService
        .deleteHousingLocation(this.housingLocation.id)
        .subscribe({
          next: () => {
            this.snackBar.open('✅ House deleted successfully!', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
            this.spinner.hide();
            if (this.dialogRef) {
              this.dialogRef.close();
            }
            this.router.navigateByUrl('/');
          },
          error: () => {
            this.snackBar.open('❌ Failed to delete the house.', 'Close', {
              duration: 3000,
              horizontalPosition: 'center',
              verticalPosition: 'top',
            });
            this.spinner.hide();
          },
        });
    });
  }

  canEditOrDelete(): boolean {
    // Admin e Manager podem editar qualquer casa
    if (
      this.currentUserRole === 'Admin' ||
      this.currentUserRole === 'Manager'
    ) {
      return true;
    }
    // Usuário comum só pode editar se for o criador
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );
    return this.housingLocation?.createBy === currentUser?.id;
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.router.navigateByUrl('/');
    }
  }
  trackByStateId(
    index: number,
    state: { name: string; isoCode: string }
  ): string {
    // CORRIGIDO para IState e tipo de retorno para string (isoCode) ou number (id)
    return state.isoCode; // Ou state.name se for um identificador melhor/único
  }

  trackByCityId(index: number, city: string): string {
    // CORRIGIDO para city: string, pois filteredCities é string[]
    return city; // Retorna a própria string da cidade como identificador
  }
}
