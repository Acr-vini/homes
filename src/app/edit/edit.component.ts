import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';
import { State, City } from 'country-state-city';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatCardModule }      from '@angular/material/card';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule }    from '@angular/material/select';

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
    MatSelectModule
  ],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {
  form!: FormGroup;
  housingLocation!: HousingLocation;
  imagePreview: string | ArrayBuffer | null = null;

  states = State.getStatesOfCountry('US');
  cities: { name: string; }[] = [];

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
      next: house => {
        this.housingLocation = house;
        this.imagePreview = house.imageUrl ?? house.photo ?? null;
        this.form = this.fb.group({
          name: [house.name, Validators.required],
          state: [house.state, Validators.required],
          city: [house.city, Validators.required],
          photo: [house.photo || ''],
          imageUrl: [house.imageUrl || '']
        });
        // popula cities iniciais
        this.cities = City.getCitiesOfState('US', house.state).map(c => ({ name: c.name }));
        this.form.get('state')?.valueChanges.subscribe((code: string) => {
          this.cities = City.getCitiesOfState('US', code).map(c => ({ name: c.name }));
          this.form.get('city')?.setValue('');
        });
      }, error: () => this.router.navigateByUrl('/')
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.imagePreview = result;
        this.form.patchValue({ imageUrl: result, photo: result });
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSubmit(): void {
    if (this.form.invalid || !this.housingLocation.id) return;
    const payload = { ...this.form.value, photo: this.form.value.photo };
    this.housingService.updateHousingLocation(this.housingLocation.id, payload).subscribe({
      next: () => { this.snackBar.open('Casa atualizada com sucesso!', 'Fechar', { duration: 3000 }); setTimeout(() => this.router.navigateByUrl('/'), 500); },
      error: () => this.snackBar.open('Falha ao atualizar.', 'Fechar', { duration: 3000 })
    });
  }

  onDelete(): void {
    if (!this.housingLocation.id) return;
    if (!confirm('Tem certeza que deseja excluir esta casa?')) return;
    this.housingService.deleteHousingLocation(this.housingLocation.id).subscribe({
      next: () => { this.snackBar.open('Casa excluída com sucesso!', 'Fechar', { duration: 3000 }); setTimeout(() => this.router.navigateByUrl('/'), 500); },
      error: () => this.snackBar.open('Erro ao excluir.', 'Fechar', { duration: 3000 })
    });
  }
}
