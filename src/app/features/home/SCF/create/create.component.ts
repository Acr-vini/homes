// create.component.ts

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
// NOVO: Importe o MatProgressBarModule
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
    NgxSpinnerModule, // NOVO: Adicione o MatProgressBarModule aos imports
    MatProgressBarModule,
    MatTooltipModule,
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  form: FormGroup; // NOVO: Adicione a propriedade para controlar o progresso
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

  propertyTypes = [
    { value: 'apartment', viewValue: 'apartment' },
    { value: 'house', viewValue: 'house' },
    { value: 'terrain', viewValue: 'terrain' },
    { value: 'studio', viewValue: 'studio' },
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
      state: this.stateControl,
      city: this.cityControl,
      availableUnits: [0, [Validators.required, Validators.min(1)]],
      wifi: [false],
      laundry: [false],
      photo: ['', Validators.required],
      typeOfBusiness: ['sell', Validators.required],
      propertyType: ['', Validators.required],
      createBy: [''],
    });
  }

  ngOnInit(): void {
    // Filtra estados conforme digita
    this.filteredStates = this.stateControl.valueChanges.pipe(
      startWith(this.stateControl.value),
      map((value) => this._filterStates(value))
    ); // Atualiza cidades quando estado muda

    this.stateControl.valueChanges.subscribe((val) => {
      const iso = this._findStateIso(val);
      this.allCities = iso
        ? City.getCitiesOfState('US', iso).map((c) => c.name)
        : [];
      this.filteredCities = this.cityControl.valueChanges.pipe(
        startWith(this.cityControl.value),
        map((v) => this._filterCities(v))
      );
      this.cityControl.setValue('');
    }); // Filtra cidades conforme digita

    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith(this.cityControl.value),
      map((v) => this._filterCities(v))
    ); // Inscreva-se nas mudanças do formulário para calcular o progresso

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

    this.spinner.show(); // 2. CORREÇÃO PRINCIPAL: Busca o código ISO a partir do nome do estado no formulário

    const stateName = this.stateControl.value;
    const stateIsoCode = this._findStateIso(stateName); // 3. Validação para garantir que um estado válido foi selecionado

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
      createBy: String(currentUser?.id ?? ''),
      editedBy: '',
      deletedBy: '',
      deleted: false,
      ownerId: currentUser.id,
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
