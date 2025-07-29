import { Component, Inject, signal } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';

export interface ReviewFormData {
  houseName: string;
  advertiserName: string;
}

@Component({
  selector: 'app-advertiser-review-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
  ],
  templateUrl: './advertiser-review-form.component.html',
  styleUrls: ['./advertiser-review-form.component.scss'],
})
export class AdvertiserReviewFormComponent {
  reviewForm: FormGroup;
  // Signal para controlar a seleção de estrelas de forma reativa
  rating = signal(0);

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<AdvertiserReviewFormComponent>,
    // Injeta os dados passados para o modal (nome da casa, do anunciante, etc.)
    @Inject(MAT_DIALOG_DATA) public data: ReviewFormData
  ) {
    this.reviewForm = this.fb.group({
      comment: ['', [Validators.required, Validators.minLength(10)]],
    });
  }

  /**
   * Define a nota (número de estrelas) quando uma estrela é clicada.
   * @param newRating A nova nota de 1 a 5.
   */
  setRating(newRating: number): void {
    this.rating.set(newRating);
  }

  /**
   * Valida e envia a avaliação.
   */
  submitReview(): void {
    // Marca o formulário como "tocado" para exibir erros, se houver
    this.reviewForm.markAllAsTouched();

    // Valida se o formulário é válido E se uma nota foi dada
    if (this.reviewForm.invalid || this.rating() === 0) {
      return; // Interrompe a submissão se algo estiver inválido
    }

    // Fecha o modal e retorna um objeto com os dados da avaliação
    // para o componente que o chamou (ActivityDateComponent).
    this.dialogRef.close({
      rating: this.rating(),
      comment: this.reviewForm.value.comment,
    });
  }
}
