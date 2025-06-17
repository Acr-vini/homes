// filepath: c:\Users\m74036\Desktop\homes-projeto\src\app\features\home\house-list\house-cards\details\reviews\reviews.component.ts
import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field'; // Necessário para o formulário
import { MatInputModule } from '@angular/material/input'; // Necessário para o formulário
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { Review } from '../../../../../../core/interfaces/review.interface';
import { User } from '../../../../../../core/interfaces/user.interface'; // Supondo que você tenha essa interface
import { ReviewService } from '../../../../../../core/services/review.service';
import { BehaviorSubject, Observable, switchMap, tap, finalize } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-reviews',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatDividerModule,
    MatSnackBarModule,
    MatFormFieldModule,
    MatInputModule,
    MatTooltipModule,
    NgxSpinnerModule,
  ],
  templateUrl: './reviews.component.html',
  styleUrls: ['./reviews.component.scss'],
})
export class ReviewsComponent implements OnInit {
  @Input() housingLocationId!: string;
  @Input() currentUser: User | null = null; // Recebe o usuário atual

  private reviewService = inject(ReviewService);
  private snackBar = inject(MatSnackBar);
  private spinner = inject(NgxSpinnerService); // Injetar o serviço do spinner

  reviews$!: Observable<Review[]>;
  private refreshReviews$ = new BehaviorSubject<void>(undefined);

  reviewForm = new FormGroup({
    userName: new FormControl(''),
    rating: new FormControl(5), // Default rating
    comment: new FormControl(''),
  });
  editingReviewId: string | null = null;

  ngOnInit(): void {
    if (!this.housingLocationId) {
      console.error('ReviewsComponent: housingLocationId is required.');
      return;
    }

    this.spinner.show(); // Mostrar spinner ao carregar reviews
    this.reviews$ = this.refreshReviews$.pipe(
      switchMap(() =>
        this.reviewService.getReviewsByLocation(this.housingLocationId).pipe(
          tap(() => this.spinner.hide()) // Esconder spinner após carregar
        )
      )
    );

    if (this.currentUser) {
      this.reviewForm.patchValue({ userName: this.currentUser.name });
    }
  }

  get canEditReviews(): boolean {
    return (
      this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager'
    );
  }

  submitReview() {
    if (!this.reviewForm.valid || !this.housingLocationId) return;

    const formValue = this.reviewForm.value;
    const isEditing = !!this.editingReviewId;

    const reviewData: Partial<Review> = {
      // Usar Partial<Review> para update
      userName: formValue.userName ?? '',
      rating: formValue.rating ?? 5,
      comment: formValue.comment ?? '',
    };

    this.spinner.show(); // Mostrar spinner ao submeter a review
    const operation$ = isEditing
      ? this.reviewService.updateReview(this.editingReviewId!, reviewData)
      : this.reviewService.addReview({
          ...reviewData,
          id: '', // O backend deve gerar o ID
          housingLocationId: this.housingLocationId,
          date: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
        } as Review); // Cast para Review para addReview

    operation$
      .pipe(
        tap(() => {
          const message = isEditing
            ? '✅ Review updated successfully!'
            : '✅ Review added successfully!';
          this.snackBar.open(message, '', { duration: 3000 });
        }),
        finalize(() => this.spinner.hide()) // Esconder spinner após operação
      )
      .subscribe(() => {
        this.refreshReviews$.next();
        this.reviewForm.reset({
          userName: this.currentUser?.name ?? '',
          rating: 5,
          comment: '',
        });
        this.editingReviewId = null;
      });
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
        this.spinner.show(); // Mostrar spinner ao deletar a review
        this.reviewService
          .deleteReview(review.id)
          .pipe(
            finalize(() => this.spinner.hide()) // Esconder spinner após operação
          )
          .subscribe(() => {
            this.snackBar.open('✅ Review deleted!', '', { duration: 2000 });
            this.refreshReviews$.next();
          });
      }
    });
  }

  setRating(star: number) {
    this.reviewForm.get('rating')?.setValue(star);
  }

  isStarActive(star: number): boolean {
    return star <= (this.reviewForm.get('rating')?.value ?? 0);
  }

  trackByReviewId(index: number, review: Review): string | number {
    return review.id || index;
  }
}
