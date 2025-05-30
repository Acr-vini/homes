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
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss'],
})
export class CreateComponent implements OnInit {
  form: FormGroup;
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

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private spinner: NgxSpinnerService, // Corrija aqui
    @Optional() public dialogRef?: MatDialogRef<CreateComponent>
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      state: this.stateControl,
      city: this.cityControl,
      availableUnits: [0, [Validators.required, Validators.min(1)]],
      wifi: [false],
      laundry: [false],
      imageUrl: [''],
      typeOfBusiness: ['sell', Validators.required],
    });
  }

  ngOnInit(): void {
    // Filtra estados conforme digita
    this.filteredStates = this.stateControl.valueChanges.pipe(
      startWith(this.stateControl.value),
      map((value) => this._filterStates(value))
    );

    // Atualiza cidades quando estado muda
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
    });

    // Filtra cidades conforme digita
    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith(this.cityControl.value),
      map((v) => this._filterCities(v))
    );
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
  }

  onSubmit(): void {
    if (this.form.invalid) return;

    this.spinner.show();

    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );
    const payload = {
      ...this.form.value,
      createBy: currentUser?.id,
      editedBy: '',
      deletedBy: '',
    };
    delete payload.createdBy;

    this.housingService.createHousingLocation(payload).subscribe({
      next: () => {
        this.snackBar.open('✅ House created!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.form.reset();
        this.imagePreview = null;
        this.spinner.hide();
        if (this.dialogRef) {
          this.dialogRef.close();
        } else {
          setTimeout(() => this.router.navigate(['/']), 100);
        }
      },
      error: () => {
        this.snackBar.open('❌ Error creating house', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
        });
        this.spinner.hide();
      },
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.form.get('imageUrl')?.setValue(reader.result as string);
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
