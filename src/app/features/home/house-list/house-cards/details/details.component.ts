import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Review } from '../../../../../core/interfaces/review.interface';
import { ReviewService } from '../../../../../core/services/review.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationService } from '../../../../../core/services/application.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { BehaviorSubject, Observable, switchMap, tap } from 'rxjs';

@Component({
  selector: 'app-details',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatButtonModule,
    MatCardModule,
    MatTooltipModule,
    MatSnackBarModule,
    NgxSpinnerModule,
    MatDividerModule,
    MatSelectModule,
    MatOptionModule,
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent implements OnInit {
  // SECTION: Properties and Injections
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  housingService = inject(HousingService);
  applicationService = inject(ApplicationService);
  snackBar = inject(MatSnackBar);
  reviewService = inject(ReviewService);

  housingLocation: HousingLocation | undefined;
  reviews$!: Observable<Review[]>;
  private refreshReviews$ = new BehaviorSubject<void>(undefined);

  applyForm = new FormGroup({
    name: new FormControl(''),
    email: new FormControl(''),
    visitDate: new FormControl(''),
    visitTime: new FormControl(''),
    checkInDate: new FormControl(''),
    checkOutDate: new FormControl(''),
    phone: new FormControl(''),
    location: new FormControl(''),
  });

  reviewForm = new FormGroup({
    userName: new FormControl(''),
    rating: new FormControl(5),
    comment: new FormControl(''),
  });

  editingReviewId: string | null = null;
  currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
  today = new Date().toISOString().split('T')[0];
  visitHours = [
    '08:00',
    '09:00',
    '10:00',
    '11:00',
    '12:00',
    '13:00',
    '14:00',
    '15:00',
    '16:00',
    '17:00',
    '18:00',
    '19:00',
    '20:00',
  ];

  get canEditReviews(): boolean {
    return (
      this.currentUser?.role === 'Admin' || this.currentUser?.role === 'Manager'
    );
  }

  // SECTION: Lifecycle Hooks
  constructor() {
    const housingLocationId = String(this.route.snapshot.paramMap.get('id'));
    if (!housingLocationId) {
      console.error('ID inválido:', housingLocationId);
      return;
    }

    this.housingService.getHousingLocationById(housingLocationId).subscribe({
      next: (location) => {
        this.housingLocation = location;
        this.reviews$ = this.refreshReviews$.pipe(
          switchMap(() =>
            this.reviewService.getReviewsByLocation(String(location.id))
          )
        );
      },
      error: (err) => console.error('Erro ao carregar detalhes da casa:', err),
    });
  }

  ngOnInit(): void {
    if (this.currentUser) {
      this.applyForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        location: this.currentUser.location,
      });
      this.reviewForm.patchValue({ userName: this.currentUser.name });
    }
  }

  // SECTION: Review Methods
  submitReview() {
    if (!this.reviewForm.valid || !this.housingLocation) return;

    const formValue = this.reviewForm.value;
    const isEditing = !!this.editingReviewId;

    const operation$ = isEditing
      ? this.reviewService.updateReview(this.editingReviewId!, {
          userName: formValue.userName ?? '',
          rating: formValue.rating ?? 5,
          comment: formValue.comment ?? '',
        })
      : this.reviewService.addReview({
          userName: formValue.userName ?? '',
          rating: formValue.rating ?? 5,
          comment: formValue.comment ?? '',
          housingLocationId: this.housingLocation.id,
          date: new Date().toISOString().slice(0, 10),
        });

    operation$
      .pipe(
        tap(() => {
          const message = isEditing
            ? 'Review updated successfully!'
            : 'Review added successfully!';
          this.snackBar.open(message, '', { duration: 3000 });
        })
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
        this.reviewService.deleteReview(review.id).subscribe(() => {
          this.snackBar.open('Review deleted!', '', { duration: 2000 });
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

  // SECTION: Application Methods
  submitApplication(): void {
    if (this.applyForm.valid) {
      const snackBarRef = this.snackBar.open(
        'Are you sure you want to apply?',
        'Yes',
        { duration: 5000 }
      );
      snackBarRef.onAction().subscribe(() => {
        const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
        this.applicationService.add({
          id: '',
          userId: user.id,
          houseId: this.housingLocation!.id,
          typeOfBusiness: this.housingLocation!.typeOfBusiness,
          houseName: this.housingLocation!.name,
          city: this.housingLocation!.city,
          state: this.housingLocation!.state,
          visitDate: this.applyForm.get('visitDate')?.value ?? undefined,
          visitTime: this.applyForm.get('visitTime')?.value ?? undefined,
          checkInDate: this.applyForm.get('checkInDate')?.value ?? undefined,
          checkOutDate: this.applyForm.get('checkOutDate')?.value ?? undefined,
          timestamp: new Date().toISOString(),
        });
        this.snackBar.open('✅ Application completed successfully', '', {
          duration: 3000,
        });
        this.goToConfirmationScreen();
      });
    } else {
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
    }
  }

  goToConfirmationScreen() {
    this.router.navigate(['/details-application'], {
      state: {
        houseId: this.housingLocation?.id,
        typeOfBusiness: this.housingLocation?.typeOfBusiness,
        houseName: this.housingLocation?.name,
        city: this.housingLocation?.city,
        state: this.housingLocation?.state,
        visitDate: this.applyForm.get('visitDate')?.value,
        visitTime: this.applyForm.get('visitTime')?.value,
        checkInDate: this.applyForm.get('checkInDate')?.value,
        checkOutDate: this.applyForm.get('checkOutDate')?.value,
      },
    });
  }

  trackByReviewId(index: number, review: Review): string | number {
    return review.id || index;
  }
}
