import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';
import { HousingFormValues } from '../housingformvalues';

// Angular Material
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule }     from '@angular/material/input';
import { MatButtonModule }    from '@angular/material/button';
import { MatIconModule }      from '@angular/material/icon';
import { MatCardModule }      from '@angular/material/card';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss']
})
export class EditComponent implements OnInit {
  housingLocation!: HousingLocation;
  successMessage = '';
  errorMessage = '';

  constructor(
    private housingService: HousingService,
    private route: ActivatedRoute,
    private router: Router
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id') || '';
    this.housingService.getHousingLocationById(id).subscribe({
      next: (house) => {
        this.housingLocation = house;
        // Se a imagem estiver apenas em `imageUrl`, copia para `photo`
        this.housingLocation.photo = this.housingLocation.photo || this.housingLocation.imageUrl;
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
        this.housingLocation.imageUrl = result;
        this.housingLocation.photo = result;
      };
      reader.readAsDataURL(input.files[0]);
    }
  }

  onSubmit(form: any): void {
    if (!form.valid) return;

    const payload: HousingFormValues = {
      name:  this.housingLocation.name,
      city:  this.housingLocation.city,
      state: this.housingLocation.state,
      photo: this.housingLocation.photo ?? ''
    };

    this.housingService.updateHousingLocation(this.housingLocation.id, payload).subscribe({
      next: () => {
        this.successMessage = 'Casa atualizada com sucesso!';
        this.errorMessage = '';
        setTimeout(() => this.router.navigateByUrl('/'), 500);
      },
      error: () => {
        this.errorMessage = 'Falha ao atualizar. Tente novamente.';
        this.successMessage = '';
      }
    });
  }

  onDelete(): void {
    if (!this.housingLocation || !this.housingLocation.id) return;

    const confirmDelete = confirm('Tem certeza que deseja excluir esta casa?');

    if (confirmDelete) {
      this.housingService.deleteHousingLocation(this.housingLocation.id).subscribe({
        next: () => {
          this.successMessage = 'Casa excluída com sucesso!';
          this.errorMessage = '';
          setTimeout(() => this.router.navigateByUrl('/'), 500);
        },
        error: () => {
          this.errorMessage = 'Erro ao excluir. Tente novamente.';
          this.successMessage = '';
        }
      });
    }
  }
}
