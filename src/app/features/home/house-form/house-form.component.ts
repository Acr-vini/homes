import { Component, OnInit, Optional, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { HousingService } from '../../../core/services/housing.service';
import { HousingLocation } from '../../../core/interfaces/housinglocation.interface';
import { State, City, IState } from 'country-state-city';
import { Observable, EMPTY } from 'rxjs';
import { startWith, map, switchMap, finalize } from 'rxjs/operators';

import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatDialogRef } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { GeocodingService } from '../../../core/services/geocoding.service';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

@Component({
  selector: 'app-house-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatTooltipModule,
    NgxSpinnerModule,
    MatProgressBarModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  templateUrl: './house-form.component.html',
  styleUrls: ['./house-form.component.scss'],
})
export class HouseFormComponent implements OnInit {
  form!: FormGroup;
  imagePreview: string | null = null;
  progress = 0;
  isEditMode = false;
  private currentHouseId: string | null = null;

  allStates: IState[] = State.getStatesOfCountry('US');
  allCities: string[] = [];
  filteredStates!: Observable<IState[]>;
  filteredCities!: Observable<string[]>;

  residentialPropertyTypes = [
    { value: 'apartment', viewValue: 'Apartment', icon: 'apartment' },
    { value: 'house', viewValue: 'House & Townhouse', icon: 'home' },
    { value: 'condo', viewValue: 'Condo', icon: 'domain' },
    { value: 'studio', viewValue: 'Studio', icon: 'meeting_room' },
    { value: 'flat', viewValue: 'Flat', icon: 'hotel' },
    { value: 'loft', viewValue: 'Loft', icon: 'roofing' },
    { value: 'penthouse', viewValue: 'Penthouse', icon: 'villa' },
    { value: 'farm', viewValue: 'Farm', icon: 'agriculture' },
    { value: 'land', viewValue: 'Land/Lot', icon: 'terrain' },
    { value: 'land_condo', viewValue: 'Land in Condo', icon: 'location_city' },
  ];
  commercialPropertyTypes = [
    { value: 'office', viewValue: 'Office', icon: 'business' },
    {
      value: 'commercial_house',
      viewValue: 'Commercial House',
      icon: 'home_work',
    },
    { value: 'store', viewValue: 'Store', icon: 'store' },
    { value: 'warehouse', viewValue: 'Warehouse', icon: 'inventory' },
    { value: 'commercial_land', viewValue: 'Commercial Land', icon: 'terrain' },
    { value: 'building', viewValue: 'Building', icon: 'apartment' },
    { value: 'garage', viewValue: 'Garage', icon: 'local_parking' },
    { value: 'farm', viewValue: 'Farm', icon: 'agriculture' },
  ];

  availableDays = [
    { name: 'Monday', controlName: 'monday' },
    { name: 'Tuesday', controlName: 'tuesday' },
    { name: 'Wednesday', controlName: 'wednesday' },
    { name: 'Thursday', controlName: 'thursday' },
    { name: 'Friday', controlName: 'friday' },
    { name: 'Saturday', controlName: 'saturday' },
    { name: 'Sunday', controlName: 'sunday' },
  ];
  availableTimes = [
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
  ];

  private geocodingService = inject(GeocodingService);

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private router: Router,
    private snackBar: MatSnackBar,
    private spinner: NgxSpinnerService,
    private route: ActivatedRoute,
    @Optional() public dialogRef?: MatDialogRef<HouseFormComponent>
  ) {}

  ngOnInit(): void {
    this.currentHouseId = this.route.snapshot.paramMap.get('id');
    this.isEditMode = !!this.currentHouseId;

    this.initializeForm();

    if (this.isEditMode && this.currentHouseId) {
      this.loadHouseData(this.currentHouseId);
    } else {
      const currentUser = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      );
      if (currentUser) {
        this.form.patchValue({ ownerId: currentUser.id });
      }
    }

    this._setupFilters();
    this.form.valueChanges.subscribe(() => this.calculateProgress());
  }

  get priceLabel(): string {
    if (!this.form) return 'Price (USD)';
    const type = this.form.get('typeOfBusiness')?.value;
    return type === 'rent' ? 'Price per day (USD)' : 'Price (USD)';
  }

  private initializeForm(house?: HousingLocation): void {
    this.form = this.fb.group({
      name: [house?.name || '', Validators.required],
      city: [house?.city || '', Validators.required],
      state: [
        house ? this._findStateName(house.state) : '',
        Validators.required,
      ],
      photo: [house?.photo || '', Validators.required],
      availableUnits: [
        house?.availableUnits ?? 1,
        [Validators.required, Validators.min(0)],
      ],
      wifi: [house?.wifi || false],
      laundry: [house?.laundry || false],
      price: [house?.price || 0, [Validators.required, Validators.min(1)]],
      typeOfBusiness: [house?.typeOfBusiness || 'sell', Validators.required],
      propertyType: [house?.propertyType || '', Validators.required],
      sellerType: [house?.sellerType || 'Owner', Validators.required],
      ownerId: [house?.ownerId || ''],
      visitStartTime: [null],
      visitEndTime: [null],
      visitAvailability: this.fb.group({
        monday: [!!house?.visitAvailability?.['monday']],
        mondayTimes: [house?.visitAvailability?.['monday'] || []],
        tuesday: [!!house?.visitAvailability?.['tuesday']],
        tuesdayTimes: [house?.visitAvailability?.['tuesday'] || []],
        wednesday: [!!house?.visitAvailability?.['wednesday']],
        wednesdayTimes: [house?.visitAvailability?.['wednesday'] || []],
        thursday: [!!house?.visitAvailability?.['thursday']],
        thursdayTimes: [house?.visitAvailability?.['thursday'] || []],
        friday: [!!house?.visitAvailability?.['friday']],
        fridayTimes: [house?.visitAvailability?.['friday'] || []],
        saturday: [!!house?.visitAvailability?.['saturday']],
        saturdayTimes: [house?.visitAvailability?.['saturday'] || []],
        sunday: [!!house?.visitAvailability?.['sunday']],
        sundayTimes: [house?.visitAvailability?.['sunday'] || []],
      }),
      checkInStart: [null],
      checkInEnd: [null],
      checkInAvailability: [house?.checkInAvailability || []],
    });
  }

  private loadHouseData(id: string): void {
    this.spinner.show();
    this.housingService
      .getHousingLocationById(id)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: (house) => {
          if (house) {
            this.initializeForm(house);
            this.imagePreview = house.photo;
          } else {
            this.snackBar.open('❌ House not found!', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/home']);
          }
        },
        error: () => {
          this.snackBar.open('❌ Error loading house data.', 'Close', {
            duration: 3000,
          });
          this.router.navigate(['/home']);
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.snackBar.open('❌ Please fill all required fields.', 'Close', {
        duration: 3000,
      });
      this.form.markAllAsTouched();
      return;
    }

    this.spinner.show();
    if (this.isEditMode) {
      this.updateHouse();
    } else {
      this.createHouse();
    }
  }

  private createHouse(): void {
    const formValues = this.form.getRawValue();
    const stateIsoCode = this._findStateIso(formValues.state);
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );

    if (!stateIsoCode) {
      this.snackBar.open('❌ Invalid state selected.', 'Close', {
        duration: 3000,
      });
      this.spinner.hide();
      return;
    }

    this.geocodingService
      .getCoordinates(formValues.city, stateIsoCode)
      .pipe(
        switchMap((coordinates) => {
          if (!coordinates) {
            this.snackBar.open(
              '❌ Could not find location. Please check the address.',
              'Close',
              { duration: 4000 }
            );
            return EMPTY;
          }

          const payload: Omit<HousingLocation, 'id'> = {
            ...formValues,
            state: stateIsoCode,
            createBy: String(currentUser?.id ?? ''),
            deleted: false,
            listedDate: new Date().toISOString(),
            latitude: coordinates.lat,
            longitude: coordinates.lon,
          };
          return this.housingService.createHousingLocation(payload);
        }),
        finalize(() => this.spinner.hide())
      )
      .subscribe({
        next: () => {
          this.snackBar.open('✅ House created successfully!', 'Close', {
            duration: 3000,
          });
          this.housingService.notifyHouseListUpdated();
          this.form.reset();
          this.imagePreview = null;
          this.router.navigate(['/profile'], {
            queryParams: { tab: 'listings' },
          });
        },
        error: (err) => {
          this.snackBar.open('❌ Error creating house.', 'Close', {
            duration: 3000,
          });
          console.error('Create house failed:', err);
        },
      });
  }

  private updateHouse(): void {
    if (!this.currentHouseId) return;

    const formValues = this.form.getRawValue();
    const stateIsoCode = this._findStateIso(formValues.state);
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );

    if (!stateIsoCode) {
      this.snackBar.open('❌ Invalid state selected.', 'Close', {
        duration: 3000,
      });
      this.spinner.hide();
      return;
    }

    const updatedHouseData: Partial<HousingLocation> = {
      ...formValues,
      state: stateIsoCode,
      editedBy: currentUser?.id ?? '',
      updatedAt: new Date().toISOString(),
    };

    this.housingService
      .updateHousingLocation(this.currentHouseId, updatedHouseData)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ House updated successfully!', 'Close', {
            duration: 3000,
          });
          this.housingService.notifyHouseListUpdated();
          this.router.navigate(['/profile'], {
            queryParams: { tab: 'listings' },
          });
        },
        error: (err) => {
          this.spinner.hide();
          console.error('Error saving house:', err);
          this.snackBar.open('❌ Error updating house.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onDelete(): void {
    if (!this.currentHouseId) return;

    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this listing?',
      'Yes, Delete',
      { duration: 5000 }
    );

    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      const currentUser = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      );
      if (!currentUser?.id) {
        this.spinner.hide();
        this.snackBar.open('❌ Could not verify user.', 'Close', {
          duration: 3000,
        });
        return;
      }
      this.housingService
        .deleteHousingLocation(this.currentHouseId!, currentUser.id)
        .pipe(finalize(() => this.spinner.hide()))
        .subscribe({
          next: () => {
            this.snackBar.open('✅ Listing deleted successfully!', 'Close', {
              duration: 3000,
            });
            this.router.navigate(['/profile/my-listings']);
          },
          error: () =>
            this.snackBar.open('❌ Error deleting listing.', 'Close', {
              duration: 3000,
            }),
        });
    });
  }

  onCancel(): void {
    if (this.isEditMode) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/home']);
    }
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
        this.form.patchValue({ photo: this.imagePreview });
        this.form.get('photo')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  calculateProgress(): void {
    const totalFields = Object.keys(this.form.controls).length;
    let completedFields = 0;
    for (const key in this.form.controls) {
      if (this.form.controls[key].valid) {
        completedFields++;
      }
    }
    this.progress = (completedFields / totalFields) * 100;
  }

  private _setupFilters(): void {
    this.filteredStates = this.form.get('state')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterStates(value || ''))
    );

    this.filteredCities = this.form.get('city')!.valueChanges.pipe(
      startWith(''),
      map((value) => this._filterCities(value || ''))
    );

    this.form.get('state')!.valueChanges.subscribe((stateName) => {
      const iso = this._findStateIso(stateName);
      this.allCities = iso
        ? City.getCitiesOfState('US', iso).map((c) => c.name)
        : [];
      this.form.get('city')!.setValue('');
    });
  }

  private _filterStates(value: string): IState[] {
    const filterValue = value.toLowerCase();
    return this.allStates.filter((st) =>
      st.name.toLowerCase().includes(filterValue)
    );
  }

  private _filterCities(value: string): string[] {
    const filterValue = value.toLowerCase();
    return this.allCities.filter((city) =>
      city.toLowerCase().includes(filterValue)
    );
  }

  private _findStateIso(stateName: string): string | undefined {
    return this.allStates.find((st) => st.name === stateName)?.isoCode;
  }

  private _findStateName(isoCode: string): string | undefined {
    return this.allStates.find((st) => st.isoCode === isoCode)?.name;
  }

  trackByStateId(index: number, item: IState): string {
    return item.isoCode;
  }

  trackByCityId(index: number, item: string): string {
    return item;
  }
}
