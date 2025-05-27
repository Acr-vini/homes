import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../core/services/housing.service';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { Review } from '../../../../core/interfaces/review.interface';
import { ReviewService } from '../../../../core/services/review.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ApplicationService } from '../../../../core/services/application.service';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { Observable } from 'rxjs';

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
  route: ActivatedRoute = inject(ActivatedRoute);
  router: Router = inject(Router);
  housingService = inject(HousingService);
  applicationService = inject(ApplicationService);
  housingLocation: HousingLocation | undefined;
  snackBar = inject(MatSnackBar);
  appService = inject(ApplicationService);

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

  reviews$!: Observable<Review[]>;
  reviews: Review[] = [];

  reviewForm = new FormGroup({
    userName: new FormControl(''),
    rating: new FormControl(5),
    comment: new FormControl(''),
  });

  editingReviewId: string | null = null;

  reviewService = inject(ReviewService);

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

  /**
   * English: Prefill the form with the logged-in user's data
   * e load reviews if housingLocation já foi carregada.
   */
  ngOnInit(): void {
    // 1) Preencher name, email, phone e location
    if (this.currentUser) {
      this.applyForm.patchValue({
        name: this.currentUser.name,
        email: this.currentUser.email,
        phone: this.currentUser.phone,
        location: this.currentUser.location,
      });
    }

    // 2) Carregar reviews se a housingLocation já estiver definida
    if (this.housingLocation) {
      this.loadReviews();
    }

    this.reviews$ = this.reviewService.getReviewsByLocation(
      this.housingLocation!.id
    );
  }

  loadReviews() {
    if (!this.housingLocation) return;
    this.reviewService.getReviewsByLocation(this.housingLocation.id).subscribe({
      next: (reviews) => (this.reviews = reviews),
    });
  }

  submitApplication(): void {
    if (this.applyForm.valid) {
      // 1. Abre SnackBar de confirmação
      const snackBarRef = this.snackBar.open(
        'Are you sure you want to apply?',
        'Yes',
        { duration: 5000 }
      );

      // 2. Se clicar em "Yes", entra aqui
      snackBarRef.onAction().subscribe(() => {
        // Simula resultado (você pode fazer chamada real aqui)
        const success = true;

        if (success) {
          // 3a. Salva a aplicação no localStorage via ApplicationService
          const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
          // dentro de submitApplication(), na hora de this.appService.add(...)
          this.appService.add({
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
            checkOutDate:
              this.applyForm.get('checkOutDate')?.value ?? undefined,
            timestamp: new Date().toISOString(),
          });

          // 4a. Feedback de sucesso
          this.snackBar.open('✅ Application completed successfully', '', {
            duration: 3000,
          });

          // 5a. Navega para tela de confirmação
          this.goToConfirmationScreen();
        } else {
          // 4b. Feedback de falha
          this.snackBar.open('❌ Unsuccessful application', '', {
            duration: 3000,
          });
        }
      });
    } else {
      // 6. Caso o form não seja válido
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

  isStarActive(star: number): boolean {
    return star <= (this.reviewForm.get('rating')?.value ?? 0);
  }
}
