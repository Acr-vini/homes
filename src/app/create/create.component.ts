import { HousingLocation } from './../housinglocation';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HousingService } from '../housing.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent {
  housingLocation: HousingLocation = {
    id: 0,
    name: '',
    city: '',
    state: '',
    photo: '',
    availableUnits: 0,
    wifi: false,
    laundry: false,
    imageUrl: '',
  };

  imagePreview: string | ArrayBuffer | null = null; // Preview da imagem
  successMessage = '';
  errorMessage = '';

  constructor(private housingService: HousingService, private router: Router) {}

  onSubmit() {
    this.housingService.createHousingLocation(this.housingLocation).subscribe({
      next: (createdLocation) => {
        this.successMessage = 'House created successfully!';
        this.errorMessage = '';
        this.resetForm();

        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (err) => {
        console.error('Erro ao criar casa:', err);
        this.errorMessage = 'Failed to create house. Please try again.';
        this.successMessage = '';
      }
    });
  }

  // ✅ Adicionado para capturar e visualizar a imagem em base64
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        this.imagePreview = reader.result;
        this.housingLocation.imageUrl = reader.result as string;
      };

      reader.readAsDataURL(file);
    }
  }

  resetForm() {
    this.housingLocation = {
      id: 0,
      name: '',
      city: '',
      state: '',
      photo: '',
      availableUnits: 0,
      wifi: false,
      laundry: false,
      imageUrl: '',
    };
    this.imagePreview = null;
  }
}
