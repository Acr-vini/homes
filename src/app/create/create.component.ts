import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormControl } from '@angular/forms';
import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';
import { State, City } from 'country-state-city';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

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
    MatAutocompleteModule
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent implements OnInit {
  form: FormGroup;
  // Configura FormControls como non-nullable para emitirem apenas string
  stateControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });
  cityControl = new FormControl<string>('', { nonNullable: true, validators: [Validators.required] });

  allStates = State.getStatesOfCountry('US');
  allCities: string[] = [];

  filteredStates!: Observable<{ name: string; isoCode: string }[]>;
  filteredCities!: Observable<string[]>;

  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      state: this.stateControl,
      city: this.cityControl,
      availableUnits: [0, [Validators.required, Validators.min(1)]],
      wifi: [false],
      laundry: [false],
      imageUrl: ['']
    });
  }

  ngOnInit(): void {
    // Filtra estados conforme digita
    this.filteredStates = this.stateControl.valueChanges.pipe(
      startWith(this.stateControl.value),
      map(value => this._filterStates(value))
    );

    // Atualiza cidades quando estado muda
    this.stateControl.valueChanges.subscribe(val => {
      const iso = this._findStateIso(val);
      this.allCities = iso ? City.getCitiesOfState('US', iso).map(c => c.name) : [];
      this.filteredCities = this.cityControl.valueChanges.pipe(
        startWith(this.cityControl.value),
        map(v => this._filterCities(v))
      );
      this.cityControl.setValue('');
    });

    // Filtra cidades conforme digita
    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith(this.cityControl.value),
      map(v => this._filterCities(v))
    );
  }

  private _filterStates(value: string): { name: string; isoCode: string }[] {
    const filter = value.toLowerCase();
    return this.allStates.filter(s => s.name.toLowerCase().includes(filter));
  }

  private _filterCities(value: string): string[] {
    const filter = value.toLowerCase();
    return this.allCities.filter(c => c.toLowerCase().includes(filter));
  }

  private _findStateIso(name: string): string | undefined {
    const match = this.allStates.find(s => s.name.toLowerCase() === name.toLowerCase());
    return match?.isoCode;
  }

  onSubmit(): void {
    if (this.form.invalid) return;
    const payload: HousingLocation = { id: '0', photo: '', ...this.form.value };
    this.housingService.createHousingLocation(payload).subscribe({
      next: () => {
        this.snackBar.open('House created!', 'Close', { duration: 3000 });
        this.form.reset(); this.imagePreview = null;
        setTimeout(() => this.router.navigate(['/']), 100);
      },
      error: () => this.snackBar.open('Error creating house', 'Close', { duration: 3000 })
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
}
