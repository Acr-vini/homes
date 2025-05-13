import { Component, inject } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../core/services/housing.service';
import { HousingLocation } from '../housinglocation';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { ReviewService, Review } from '../../core/services/review.service';
import { MatIconModule } from '@angular/material/icon';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatTooltipModule,
  ],
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
    visitDate: new FormControl(''),
  });

  reviews: Review[] = [];
  reviewForm = new FormGroup({
    userName: new FormControl(''),
    rating: new FormControl(5),
    comment: new FormControl(''),
  });

  editingReviewId: string | null = null;

  reviewService = inject(ReviewService);

  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');

  snackBar = inject(MatSnackBar);

  get canEditReviews(): boolean {
    return (
      this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager'
    );
  }

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
        this.loadReviews();
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da casa:', err);
      },
    });
  }

  ngOnInit() {
    if (this.housingLocation) {
      this.loadReviews();
    }
  }

  loadReviews() {
    if (!this.housingLocation) return;
    this.reviewService.getReviewsByLocation(this.housingLocation.id).subscribe({
      next: (reviews) => (this.reviews = reviews),
    });
  }

  submitApplication(): void {
    if (this.applyForm.valid) {
      console.log('📬 Formulário enviado:', this.applyForm.value);
      alert('Aplicação enviada com sucesso!');
      this.applyForm.reset();
    } else {
      alert('Por favor, preencha todos os campos.');
    }
  }

  submitReview() {
    if (this.reviewForm.valid && this.housingLocation) {
      const formValue = this.reviewForm.value;
      const review: Review = {
        userName: formValue.userName ?? '',
        rating: formValue.rating ?? 5,
        comment: formValue.comment ?? '',
        housingLocationId: this.housingLocation.id,
        date: new Date().toISOString().slice(0, 10),
      };
      this.reviewService.addReview(review).subscribe(() => {
        this.loadReviews();
        this.reviewForm.reset({ rating: 5 });
      });
    }
  }

  setRating(star: number) {
    this.reviewForm.get('rating')?.setValue(star);
  }

  editReview(review: Review) {
    this.reviewForm.patchValue({
      userName: review.userName,
      rating: review.rating,
      comment: review.comment,
    });

    this.editingReviewId = review.id ?? null;
  }

  deleteReview(review: Review) {
    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this review?',
      'Yes',
      { duration: 5000 }
    );
    snackBarRef.onAction().subscribe(() => {
      if (review.id) {
        this.reviewService.deleteReview(review.id).subscribe(() => {
          this.loadReviews();
          this.snackBar.open('Review deleted!', '', { duration: 2000 });
        });
      } else {
        this.snackBar.open('Review ID is undefined.', '', { duration: 2000 });
      }
    });
  }
}
