import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  FormControl,
} from '@angular/forms';
import { HousingService } from '../../core/services/housing.service';
import { HousingLocation } from '../housinglocation';
import { HousingFormValues } from '../housingformvalues';
import { State, City } from 'country-state-city';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { Observable, startWith, map } from 'rxjs';

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
    MatAutocompleteModule,
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

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.housingService.getHousingLocationById(id).subscribe({
      next: (house) => {
        this.housingLocation = house;
        this.imagePreview = house.imageUrl ?? house.photo ?? null;

        // Montagem do formulário com valores iniciais
        this.form = this.fb.group({
          name: [house.name || '', Validators.required],
          state: this.stateControl,
          city: this.cityControl,
          photo: [house.photo || ''],
          imageUrl: [house.imageUrl || ''],
        });

        // Pegamos o nome do estado com base no ISO vindo da API
        const stateName = this._findStateName(house.state) || '';
        this.stateControl.setValue(stateName); // Estado no formulário é o nome

        const iso = house.state || '';
        this.allCities = iso
          ? City.getCitiesOfState('US', iso).map((c) => c.name)
          : [];
        this.cityControl.setValue(house.city || '');

        this._setupFilters();
      },
      error: () => this.router.navigateByUrl('/'),
    });
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
      const reader = new FileReader();
      reader.onload = () => {
        const res = reader.result as string;
        this.imagePreview = res;
        this.form.patchValue({ imageUrl: res, photo: res });
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.housingLocation.id) return;

    const iso =
      this._findStateIso(this.stateControl.value) || this.housingLocation.state;

    const payload: HousingFormValues = {
      name: this.form.value.name,
      state: iso,
      city: this.cityControl.value,
      photo: this.form.value.photo || '',
    };

    this.housingService
      .updateHousingLocation(this.housingLocation.id, payload)
      .subscribe({
        next: () => {
          this.snackBar.open('House updated successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

          this.router.navigateByUrl('/');
        },
        error: () =>
          this.snackBar.open('Failed to update the house.', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }),
      });
  }

  onDelete(): void {
    if (!this.housingLocation.id) return;
    if (!confirm('Are you sure you want to delete this house?')) return;

    this.housingService
      .deleteHousingLocation(this.housingLocation.id)
      .subscribe({
        next: () => {
          this.snackBar.open('House deleted successfully!', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          });

          this.router.navigateByUrl('/');
        },
        error: () =>
          this.snackBar.open('Failed to delete the house.', 'Close', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
          }),
      });
  }
}
