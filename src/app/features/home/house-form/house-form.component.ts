import {
  Component,
  computed,
  inject,
  OnInit,
  Optional,
  signal,
  ChangeDetectionStrategy,
  DestroyRef,
} from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialogRef } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NgxSpinnerService } from 'ngx-spinner';
import { Observable, of } from 'rxjs';
import {
  finalize,
  debounceTime,
  distinctUntilChanged,
  tap,
  catchError,
  switchMap,
} from 'rxjs/operators';
import { HousingLocation } from '../../../core/interfaces/housinglocation.interface';
import { HousingService } from '../../../core/services/housing.service';
import { addressService } from '../../../core/services/address.service';
import { IState, State } from 'country-state-city';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

// --- Imports dos Módulos ---
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule } from 'ngx-spinner';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatNativeDateModule } from '@angular/material/core';

const AVAILABLE_TIMES = [
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
const RESIDENTIAL_PROPERTY_TYPES = [
  { value: 'apartment', viewValue: 'Apartment', icon: 'apartment' },
  { value: 'house', viewValue: 'House & Townhouse', icon: 'home' },
  { value: 'condo', viewValue: 'Condo', icon: 'domain' },
  { value: 'studio', viewValue: 'Studio', icon: 'meeting_room' },
  { value: 'flat', viewValue: 'Flat', icon: 'hotel' },
  { value: 'loft', viewValue: 'Loft', icon: 'night_shelter' },
  { value: 'penthouse', viewValue: 'Penthouse', icon: 'roofing' },
];
const COMMERCIAL_PROPERTY_TYPES = [
  { value: 'office', viewValue: 'Office', icon: 'business_center' },
  { value: 'store', viewValue: 'Store', icon: 'storefront' },
  { value: 'warehouse', viewValue: 'Warehouse', icon: 'warehouse' },
  { value: 'industrial', viewValue: 'Industrial', icon: 'factory' },
  { value: 'terrain', viewValue: 'Terrain', icon: 'landscape' },
];

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
    MatProgressSpinnerModule,
    MatDividerModule,
    MatDatepickerModule,
    MatNativeDateModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './house-form.component.html',
  styleUrls: ['./house-form.component.scss'],
})
export class HouseFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private housingService = inject(HousingService);
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private spinner = inject(NgxSpinnerService);
  private route = inject(ActivatedRoute);
  private addressService = inject(addressService);
  private destroyRef = inject(DestroyRef);

  form!: FormGroup;
  progress = signal(0);
  isZipLoading = signal(false);
  imagePreviews = signal<string[]>([]);
  private currentHouseId = signal<string | null>(null);

  isEditMode = computed(() => !!this.currentHouseId());
  priceLabel = computed(() =>
    this.form?.get('typeOfBusiness')?.value === 'rent'
      ? 'Price per day (USD)'
      : 'Price (USD)'
  );

  readonly availableTimes = AVAILABLE_TIMES;
  readonly residentialPropertyTypes = RESIDENTIAL_PROPERTY_TYPES;
  readonly commercialPropertyTypes = COMMERCIAL_PROPERTY_TYPES;
  readonly allStates: IState[] = State.getStatesOfCountry('US');

  private lastFetchedLocation: {
    lat: number;
    lon: number;
    stateCode: string;
  } | null = null;

  constructor(
    @Optional() public dialogRef?: MatDialogRef<HouseFormComponent>
  ) {}

  ngOnInit(): void {
    this.initializeForm();

    const houseId = this.route.snapshot.paramMap.get('id');
    this.currentHouseId.set(houseId);

    if (this.isEditMode() && houseId) {
      this.loadHouseData(houseId);
    }

    this.setupFormListeners();
  }

  private initializeForm(): void {
    this.form = this.fb.group({
      id: [''],
      name: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      zipCode: ['', Validators.required],
      state: [{ value: '', disabled: true }, Validators.required],
      city: [{ value: '', disabled: true }, Validators.required],
      availableUnits: [1, [Validators.required, Validators.min(0)]],
      photo: [''],
      typeOfBusiness: ['', Validators.required],
      propertyType: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      wifi: [false],
      laundry: [false],
      visitAvailability: this.fb.group({
        startDate: [null],
        endDate: [null],
        startTime: [null],
        endTime: [null],
      }),
      rentDateRange: this.fb.group({
        checkInDate: [null],
        checkOutDate: [null],
      }),
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
            const processedHouse = {
              ...house,
              state: this._findStateName(house.state),
            };
            // CORREÇÃO 1: Adicionar { emitEvent: false } para não disparar o valueChanges
            this.form.reset(processedHouse, { emitEvent: false });
            this.imagePreviews.set(house.photo ? [house.photo] : []);
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

  private setupFormListeners(): void {
    this.form.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.calculateProgress());
    this.setupZipCodeListener();
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.snackBar.open('❌ Please fill all required fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const payload = this._buildPayload();
    if (!payload) return;

    this.spinner.show();

    const saveOperation$ = this.isEditMode()
      ? this.housingService.updateHousingLocation(
          this.currentHouseId()!,
          payload
        )
      : this.housingService.createHousingLocation(payload as HousingLocation);

    this._handleSaveResponse(saveOperation$);
  }

  private _buildPayload(): Partial<HousingLocation> | null {
    if (!this.lastFetchedLocation && !this.isEditMode()) {
      this.snackBar.open(
        '❌ Location data is missing. Please re-enter a valid ZIP code.',
        'Close',
        { duration: 4000 }
      );
      return null;
    }
    const formValues = this.form.getRawValue();
    const currentUser = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    );

    const stateIsoCode = this._findStateIso(formValues.state);
    if (!stateIsoCode) {
      this.snackBar.open('❌ Invalid state in form.', 'Close', {
        duration: 3000,
      });
      return null;
    }

    return {
      ...formValues,
      state: stateIsoCode,
      latitude: this.lastFetchedLocation?.lat,
      longitude: this.lastFetchedLocation?.lon,
      ...(this.isEditMode()
        ? { editedBy: currentUser?.id, updatedAt: new Date().toISOString() }
        : {
            createBy: currentUser?.id,
            ownerId: currentUser?.id,
            listedDate: new Date().toISOString(),
          }),
    };
  }

  private _handleSaveResponse(obs$: Observable<any>): void {
    obs$
      .pipe(
        finalize(() => this.spinner.hide()),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe({
        next: () => {
          const messageAction = this.isEditMode() ? 'updated' : 'created';
          this.snackBar.open(
            `✅ House ${messageAction} successfully!`,
            'Close',
            { duration: 3000 }
          );
          this.housingService.notifyHouseListUpdated();
          this.router.navigate(['/profile'], {
            queryParams: { tab: 'listings' },
          });
        },
        error: (err) => {
          console.error('Save house failed:', err);
          this.snackBar.open('❌ Error saving house.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onDelete(): void {
    if (!this.currentHouseId()) return;
    const houseId = this.currentHouseId()!;

    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this listing?',
      'Yes, Delete',
      { duration: 5000 }
    );

    snackBarRef
      .onAction()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
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
          .deleteHousingLocation(houseId, currentUser.id)
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

  onClearForm(): void {
    const ownerId = this.form.get('ownerId')?.value;
    this.form.reset();
    this.imagePreviews.set([]);
    this.form.patchValue({ ownerId: ownerId });
    this.snackBar.open('Form cleared', 'Close', { duration: 2000 });
  }

  onCancel(): void {
    this.router.navigate(['/home']);
  }

  onImageSelected(event: Event): void {
    const file = (event.target as HTMLInputElement).files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      this.imagePreviews.set([result]);
      this.form.patchValue({ photo: result });
      this.form.get('photo')?.markAsDirty();
    };
    reader.readAsDataURL(file);
  }

  calculateProgress(): void {
    const totalFields = Object.keys(this.form.controls).length;
    let completedFields = 0;
    for (const key in this.form.controls) {
      if (this.form.controls[key].valid) {
        completedFields++;
      }
    }
    this.progress.set((completedFields / totalFields) * 100);
  }

  private setupZipCodeListener(): void {
    const zipControl = this.form.get('zipCode');
    if (!zipControl) return;

    zipControl.valueChanges
      .pipe(
        // CORREÇÃO 2: Operador 'skip(1)' removido daqui
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => {
          this.isZipLoading.set(true);
          this.form.patchValue({ city: '', state: '' }, { emitEvent: false });
          this.lastFetchedLocation = null;
        }),
        switchMap((zip) =>
          zip && zip.length === 5
            ? this.addressService.getAddressByZipCode(zip).pipe(
                catchError(() => {
                  this.snackBar.open(
                    'Invalid or not found ZIP Code.',
                    'Close',
                    { duration: 2000 }
                  );
                  return of(null);
                })
              )
            : of(null)
        ),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe((addressInfo) => {
        this.isZipLoading.set(false);
        if (addressInfo) {
          this.form.patchValue(
            {
              city: addressInfo.city,
              state: this._findStateName(addressInfo.state_code),
            },
            { emitEvent: false }
          );
          this.lastFetchedLocation = {
            lat: addressInfo.latitude,
            lon: addressInfo.longitude,
            stateCode: addressInfo.state_code,
          };
        }
      });
  }

  private _findStateIso = (stateName: string): string | undefined =>
    this.allStates.find((st) => st.name === stateName)?.isoCode;
  private _findStateName = (isoCode: string): string | undefined =>
    this.allStates.find((st) => st.isoCode === isoCode)?.name;
}
