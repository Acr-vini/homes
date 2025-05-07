import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';
import { HousingFormValues } from '../housingformvalues';

import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatCardModule }      from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatSnackBarModule
  ],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {
  form!: FormGroup;
  housingLocation!: HousingLocation;
  imagePreview: string | ArrayBuffer | null = null;

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

        this.form = this.fb.group({
          name: [house.name, Validators.required],
          city: [house.city, Validators.required],
          state: [house.state, Validators.required],
          photo: [house.photo || ''],
          imageUrl: [house.imageUrl || '']
        });
      },
      error: () => this.router.navigateByUrl('/')
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.imagePreview = result;
        this.form.get('imageUrl')?.setValue(result);
        this.form.get('photo')?.setValue(result);
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.housingLocation.id) return;

    const payload: HousingFormValues = {
      name: this.form.value.name,
      city: this.form.value.city,
      state: this.form.value.state,
      photo: this.form.value.photo || ''
    };

    this.housingService.updateHousingLocation(this.housingLocation.id, payload).subscribe({
      next: () => {
        this.snackBar.open('Casa atualizada com sucesso!', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['success-snackbar']
        });
        setTimeout(() => this.router.navigateByUrl('/'), 500);
      },
      error: () => {
        this.snackBar.open('Falha ao atualizar. Tente novamente.', 'Fechar', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'top',
          panelClass: ['error-snackbar']
        });
      }
    });
  }

  onDelete(): void {
    if (!this.housingLocation || !this.housingLocation.id) return;

    const confirmDelete = confirm('Tem certeza que deseja excluir esta casa?');

    if (confirmDelete) {
      this.housingService.deleteHousingLocation(this.housingLocation.id).subscribe({
        next: () => {
          this.snackBar.open('Casa excluída com sucesso!', 'Fechar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['success-snackbar']
          });
          setTimeout(() => this.router.navigateByUrl('/'), 500);
        },
        error: () => {
          this.snackBar.open('Erro ao excluir. Tente novamente.', 'Fechar', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'top',
            panelClass: ['error-snackbar']
          });
        }
      });
    }
  }
}
