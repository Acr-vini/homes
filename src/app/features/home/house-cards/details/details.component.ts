import { Component, inject } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../core/services/housing.service';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import {
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Review } from '../../../../core/interfaces/review.interface';
import { ReviewService } from '../../../../core/services/review.service';
import { MatIconModule } from '@angular/material/icon';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';

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
    MatSelectModule,
  ],
  templateUrl: './details.component.html',
  styleUrls: ['./details.component.scss'],
})
export class DetailsComponent {
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  housingService = inject(HousingService);
  housingLocation: HousingLocation | undefined;

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
      const snackBarRef = this.snackBar.open(
        'Are you sure you want to apply?',
        'Yes',
        { duration: 5000 }
      );
      snackBarRef.onAction().subscribe(() => {
        const success = true;
        if (success) {
          this.snackBar.open('✅ Application completed successfully', '', {
            duration: 3000,
          });
          this.goToConfirmationScreen();
        } else {
          this.snackBar.open('❌ Unsuccessful application', '', {
            duration: 3000,
          });
        }
      });
    } else {
      this.snackBar.open('Please fill all required fields.', 'Close', {
        duration: 3000,
      });
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
}
