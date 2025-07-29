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
import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
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
import { AvailableTimes } from '../../../shared/utils/available-times';
import { AuthService } from '../../../core/services/auth.service';

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
  readonly #fb = inject(FormBuilder);
  readonly #housingService = inject(HousingService);
  readonly #router = inject(Router);
  readonly #snackBar = inject(MatSnackBar);
  readonly #spinner = inject(NgxSpinnerService);
  readonly #route = inject(ActivatedRoute);
  readonly #addressService = inject(addressService);
  readonly #authService = inject(AuthService);
  readonly #destroyRef = inject(DestroyRef);
  readonly availableTimes = AvailableTimes;

  form: FormGroup;

  progress = signal(0);
  isZipLoading = signal(false);
  imagePreviews = signal<string[]>([]);
  private currentHouseId = signal<string | null>(null);

  typeOfBusiness = signal<string>('');

  isEditMode = computed(() => !!this.currentHouseId());
  readonly residentialPropertyTypes = RESIDENTIAL_PROPERTY_TYPES;
  readonly commercialPropertyTypes = COMMERCIAL_PROPERTY_TYPES;
  readonly allStates: IState[] = State.getStatesOfCountry('US');

  private lastFetchedLocation: {
    lat: number;
    lon: number;
    stateCode: string;
  } | null = null;

  constructor(@Optional() public dialogRef?: MatDialogRef<HouseFormComponent>) {
    this.form = this.#fb.group({
      id: [''],
      name: ['', Validators.required],
      street: ['', Validators.required],
      number: ['', Validators.required],
      neighborhood: ['', Validators.required],
      zipCode: ['', Validators.required],
      state: [{ value: '', disabled: true }, Validators.required],
      city: [{ value: '', disabled: true }, Validators.required],
      availableUnits: [1, [Validators.required, Validators.min(0)]],
      photos: this.#fb.array([], Validators.required),
      typeOfBusiness: ['', Validators.required],
      propertyType: ['', Validators.required],
      price: [null, [Validators.required, Validators.min(1)]],
      wifi: [false],
      laundry: [false],
      visitAvailability: this.#fb.group({
        startDate: [null],
        endDate: [null],
        startTime: [null],
        endTime: [null],
      }),
      rentDateRange: this.#fb.group({
        checkInDate: [null],
        checkOutDate: [null],
      }),
    });
  }

  ngOnInit(): void {
    const houseId = this.#route.snapshot.paramMap.get('id');
    this.currentHouseId.set(houseId);

    if (this.isEditMode()) {
      this.loadHouseData(houseId!);
    } else {
      // No modo de criação, desabilita ambos os grupos inicialmente.
      this.form.get('visitAvailability')?.disable();
      this.form.get('rentDateRange')?.disable();
    }

    this.setupConditionalLogic();
    this.setupFormListeners();
  }

  private setupConditionalLogic(): void {
    this.form
      .get('typeOfBusiness')
      ?.valueChanges.pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe((type) => {
        this.typeOfBusiness.set(type); // Atualiza o signal para o template
        const visitAvailabilityCtrl = this.form.get('visitAvailability');
        const rentDateRangeCtrl = this.form.get('rentDateRange');

        if (type === 'sell') {
          visitAvailabilityCtrl?.enable();
          rentDateRangeCtrl?.disable();
          rentDateRangeCtrl?.reset();
        } else if (type === 'rent') {
          rentDateRangeCtrl?.enable();
          visitAvailabilityCtrl?.disable();
          visitAvailabilityCtrl?.reset();
        } else {
          visitAvailabilityCtrl?.disable();
          rentDateRangeCtrl?.disable();
        }
      });
  }

  get photosFormArray(): FormArray {
    return this.form.get('photos') as FormArray;
  }

  private loadHouseData(id: string): void {
    this.#spinner.show();
    this.#housingService
      .getHousingLocationById(id)
      .pipe(finalize(() => this.#spinner.hide()))
      .subscribe({
        next: (house) => {
          if (house) {
            this.form.patchValue(house);

            // 1. Limpa o FormArray e as pré-visualizações existentes.
            this.photosFormArray.clear();
            this.imagePreviews.set([]);

            // 2. Se a casa tiver fotos, preenche o FormArray e atualiza o signal.
            if (house.photos && house.photos.length > 0) {
              house.photos.forEach((photoUrl) =>
                this.photosFormArray.push(this.#fb.control(photoUrl))
              );
              this.imagePreviews.set([...house.photos]);
            }
          } else {
            this.#snackBar.open('❌ House not found!', 'Close', {
              duration: 3000,
            });
            this.#router.navigate(['/home']);
          }
        },
        error: () => {
          this.#snackBar.open('❌ Error loading house data.', 'Close', {
            duration: 3000,
          });
          this.#router.navigate(['/home']);
        },
      });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.#snackBar.open('❌ Please fill all required fields.', 'Close', {
        duration: 3000,
      });
      return;
    }

    const payload = this._buildPayload();
    if (!payload) return;

    this.#spinner.show();

    const saveOperation$ = this.isEditMode()
      ? this.#housingService.updateHousingLocation(
          this.currentHouseId()!,
          payload
        )
      : this.#housingService.createHousingLocation(payload as HousingLocation);

    this._handleSaveResponse(saveOperation$);
  }

  private _buildPayload(): Partial<HousingLocation> | null {
    if (!this.lastFetchedLocation && !this.isEditMode()) {
      this.#snackBar.open(
        '❌ Location data is missing. Please re-enter a valid ZIP code.',
        'Close',
        { duration: 4000 }
      );
      return null;
    }
    const formValues = this.form.getRawValue();
    const currentUser = this.#authService.getCurrentUser();

    const stateIsoCode = this._findStateIso(formValues.state);
    if (!stateIsoCode) {
      this.#snackBar.open('❌ Invalid state in form.', 'Close', {
        duration: 3000,
      });
      return null;
    }

    const payload: Partial<HousingLocation> = {
      ...formValues,
      state: stateIsoCode,
      latitude: this.lastFetchedLocation?.lat,
      longitude: this.lastFetchedLocation?.lon,
      photos: formValues.photos,
      ...(this.isEditMode()
        ? { editedBy: currentUser?.id, updatedAt: new Date().toISOString() }
        : {
            createBy: currentUser?.id,
            ownerId: currentUser?.id,
            listedDate: new Date().toISOString(),
          }),
    };

    return payload;
  }

  private _handleSaveResponse(obs$: Observable<any>): void {
    obs$
      .pipe(
        finalize(() => this.#spinner.hide()),
        takeUntilDestroyed(this.#destroyRef)
      )
      .subscribe({
        next: () => {
          const messageAction = this.isEditMode() ? 'updated' : 'created';
          this.#snackBar.open(
            `✅ House ${messageAction} successfully!`,
            'Close',
            { duration: 3000 }
          );
          this.#housingService.notifyHouseListUpdated();
          this.#router.navigate(['/profile'], {
            queryParams: { tab: 'listings' },
          });
        },
        error: (err) => {
          console.error('Save house failed:', err);
          this.#snackBar.open('❌ Error saving house.', 'Close', {
            duration: 3000,
          });
        },
      });
  }

  onDelete(): void {
    if (!this.currentHouseId()) return;
    const houseId = this.currentHouseId()!;

    const snackBarRef = this.#snackBar.open(
      'Are you sure you want to delete this listing?',
      'Yes, Delete',
      { duration: 5000 }
    );

    snackBarRef
      .onAction()
      .pipe(takeUntilDestroyed(this.#destroyRef))
      .subscribe(() => {
        this.#spinner.show();
        const currentUser = this.#authService.getCurrentUser();
        if (!currentUser?.id) {
          this.#spinner.hide();
          this.#snackBar.open('❌ Could not verify user.', 'Close', {
            duration: 3000,
          });
          return;
        }
        this.#housingService
          .deleteHousingLocation(houseId, currentUser.id)
          .pipe(finalize(() => this.#spinner.hide()))
          .subscribe({
            next: () => {
              this.#snackBar.open('✅ Listing deleted successfully!', 'Close', {
                duration: 3000,
              });
              this.#router.navigate(['/my-listings']);
            },
            error: () =>
              this.#snackBar.open('❌ Error deleting listing.', 'Close', {
                duration: 3000,
              }),
          });
      });
  }

  onImageSelected(event: Event): void {
    const files = (event.target as HTMLInputElement).files;
    if (!files || files.length === 0) return;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        this.photosFormArray.push(this.#fb.control(result));
        this.imagePreviews.update((previews) => [...previews, result]);
        this.form.get('photos')?.markAsDirty();
      };
      reader.readAsDataURL(file);
    }
  }

  removeImage(index: number): void {
    this.photosFormArray.removeAt(index);
    this.imagePreviews.update((previews) =>
      previews.filter((_, i) => i !== index)
    );
  }

  onClearForm(): void {
    const ownerId = this.form.get('ownerId')?.value;
    this.form.reset();
    this.photosFormArray.clear();
    this.imagePreviews.set([]);
    this.form.patchValue({ ownerId: ownerId });
    this.#snackBar.open('Form cleared', 'Close', { duration: 2000 });
  }

  onCancel(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    } else {
      this.#router.navigate(['/home']);
    }
  }

  calculateProgress(): void {
    const totalControls = Object.keys(this.form.controls).length;
    let validControls = 0;
    for (const key in this.form.controls) {
      if (this.form.controls[key].valid) {
        validControls++;
      }
    }
    this.progress.set((validControls / totalControls) * 100);
  }

  setupFormListeners(): void {
    this.form
      .get('zipCode')
      ?.valueChanges.pipe(
        debounceTime(500),
        distinctUntilChanged(),
        tap(() => this.isZipLoading.set(true)),
        switchMap((zip) =>
          zip && zip.length === 5
            ? this.#addressService.getAddressByZipCode(zip).pipe(
                catchError(() => {
                  this.#snackBar.open(
                    'Invalid or not found ZIP Code.',
                    'Close',
                    { duration: 2000 }
                  );
                  return of(null);
                })
              )
            : of(null)
        ),
        takeUntilDestroyed(this.#destroyRef)
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
