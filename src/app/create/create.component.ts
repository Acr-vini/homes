import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';

// → Material modules
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatCheckboxModule }  from '@angular/material/checkbox';
import { MatCardModule }      from '@angular/material/card';
import { MatIconModule }      from '@angular/material/icon';


@Component({
  selector: 'app-create',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    // Material
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule
  ],
  templateUrl: './create.component.html',
  styleUrls: ['./create.component.scss']
})
export class CreateComponent {
  housingLocation: HousingLocation = {
    id: "0",
    name: '',
    city: '',
    state: '',
    photo: '',
    availableUnits: 0,
    wifi: false,
    laundry: false,
    imageUrl: '',
  };

  imagePreview: string | ArrayBuffer | null = null;
  successMessage = '';
  errorMessage = '';

  constructor(
    private housingService: HousingService,
    private router: Router
  ) {}

  onSubmit() {
    this.housingService.createHousingLocation(this.housingLocation).subscribe({
      next: () => {
        this.successMessage = 'House created successfully!';
        this.errorMessage = '';
        this.resetForm();
        setTimeout(() => this.router.navigate(['/']), 10);
      },
      error: () => {
        this.errorMessage = 'Failed to create house. Please try again.';
        this.successMessage = '';
      }
    });
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.housingLocation.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  resetForm() {
    this.housingLocation = {
      id: "0",
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
