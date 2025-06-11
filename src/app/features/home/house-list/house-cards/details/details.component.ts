import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { User } from '../../../../../core/interfaces/user.interface'; // Mantenha se usado para currentUser
import { ReviewsComponent } from './reviews/reviews.component'; // Importe o novo componente

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
    ReviewsComponent, // Adicione o novo componente aos imports
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

  currentUser: User | null = JSON.parse(
    localStorage.getItem('currentUser') || 'null'
  ); // Mantenha currentUser
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

  // SECTION: Lifecycle Hooks
  constructor() {
    const housingLocationId = String(this.route.snapshot.paramMap.get('id'));
    if (!housingLocationId) {
      console.error('ID inválido:', housingLocationId);
      this.router.navigateByUrl('/'); // Redireciona se não houver ID
      return;
    }

    this.housingService.getHousingLocationById(housingLocationId).subscribe({
      next: (location) => {
        this.housingLocation = location;
        // A lógica de carregar reviews foi movida para ReviewsComponent
      },
      error: (err) => {
        console.error('Erro ao carregar detalhes da casa:', err);
        this.router.navigateByUrl('/'); // Redireciona em caso de erro
      },
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
      // O patch do reviewForm foi movido para ReviewsComponent
    }
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
          id: '', // O backend deve gerar
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
}
