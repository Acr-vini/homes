import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';
import { State, City } from 'country-state-city';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent {
  form: FormGroup;
  states = State.getStatesOfCountry('US');                  // Lista de estados
  cities: { name: string }[] = [];                         // Lista de cidades do estado selecionado
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.form = this.fb.group({
      name: ['', Validators.required],
      state: ['', Validators.required],    // Armazena isoCode do estado
      city: ['', Validators.required],
      availableUnits: [0, [Validators.required, Validators.min(1)]],
      wifi: [false],
      laundry: [false],
      imageUrl: ['']
    });

    // Observa mudança de estado
    this.form.get('state')?.valueChanges.subscribe((isoCode: string) => {
      this.cities = City.getCitiesOfState('US', isoCode)
        .map(c => ({ name: c.name }));
      this.form.get('city')?.setValue(''); // limpa seleção
    });
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
