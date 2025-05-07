import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';

// → Material modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatCheckboxModule }  from '@angular/material/checkbox';
import { MatCardModule }      from '@angular/material/card';
import { MatIconModule }      from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,

    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent {
  form: FormGroup;
  imagePreview: string | ArrayBuffer | null = null;

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    // ✅ Inicializando o formulário reativo com FormBuilder
    this.form = this.fb.group({
      name: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      availableUnits: [0, [Validators.required, Validators.min(1)]],
      wifi: [false],
      laundry: [false],
      imageUrl: ['']
    });
  }

  // ✅ Manipulação do envio do formulário
  onSubmit() {
    if (this.form.invalid) return;

    const housingLocation: HousingLocation = {
      id: "0",
      photo: '',
      ...this.form.value
    };

    this.housingService.createHousingLocation(housingLocation).subscribe({
      next: () => {
        this.snackBar.open('House created successfully!', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar'] });
        this.form.reset();
        this.imagePreview = null;
        setTimeout(() => this.router.navigate(['/']), 10);
      },

      error: () => {
        this.snackBar.open('Failed to create house. Please try again.', 'Close', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar'] });
      }
    });
  }

  // ✅ Manipulação da imagem
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.form.get('imageUrl')?.setValue(reader.result as string);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }
}
