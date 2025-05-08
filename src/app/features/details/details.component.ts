import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../housing.service';
import { HousingLocation } from '../housinglocation';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  housingService = inject(HousingService);
  housingLocation: HousingLocation | undefined;

  applyForm = new FormGroup({
    firstName: new FormControl(''),
    lastName: new FormControl(''),
    email: new FormControl(''),
  });

  constructor() {
    const housingLocationId = String(this.route.snapshot.paramMap.get('id'));
    if (!housingLocationId) {
      console.error('ID inválido:', housingLocationId);
      return;
    }

    this.housingService.getHousingLocationById(housingLocationId).subscribe({
      next: (location) => {
        console.log('Dados recebidos:', location);
        this.housingLocation = location;
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da casa:', err);
      },
    });
  }

  submitApplication(): void {
    if (this.applyForm.valid) {
      console.log('📬 Formulário enviado:', this.applyForm.value);
      alert('Aplicação enviada com sucesso!');
      this.applyForm.reset(); // opcional
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  }
}
