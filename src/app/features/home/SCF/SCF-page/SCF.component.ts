// Importe o FormBuilder e FormGroup
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // ALTERADO

import { HousingService } from '../../../../core/services/housing.service';
import { HttpClientModule } from '@angular/common/http';
import { HouseCardsComponent } from '../../house-list/house-cards/house-cards-page/house-cards.component';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Vamos usar Checkbox
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LegalInfoComponent } from '../../legal-info/legal-info-page/legal-info.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../../../home/SCF/create/create.component';
import { Subject } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar'; // 1. Importe o MatSnackBar
import { CompareTrayComponent } from '../../SCF/compare/compare-tray/compare-tray.component'; // 1. Importe o novo componente

@Component({
  selector: 'app-SCF',
  standalone: true,
  imports: [
    HouseCardsComponent,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LegalInfoComponent,
    MatPaginatorModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSidenavModule,
    CompareTrayComponent,
  ],
  templateUrl: './SCF.component.html',
  styleUrls: ['./SCF.component.scss'],
})
export class SCFComponent implements OnInit {
  private housingService = inject(HousingService);
  private destroy$ = new Subject<void>();

  private fb = inject(FormBuilder);
  private snackBar = inject(MatSnackBar);

  housingLocationList: HousingLocation[] = [];
  filteredLocationList: HousingLocation[] = [];

  filterForm: FormGroup;
  displayMode: 'grid' | 'list' = 'grid'; // Define 'grid' como padrão

  propertyTypes = ['No Preference', 'house', 'apartment', 'terrain', 'studio'];

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

  pageSize = 20;
  pageIndex = 0;
  pagedLocationList: HousingLocation[] = [];

  compareMode = false;

  orderBy: 'relevance' | 'priceAsc' | 'priceDesc' | 'dateDesc' = 'relevance';

  // 3. Crie o novo método para alternar o modo de comparação
  toggleCompareMode(): void {
    this.compareMode = !this.compareMode;

    if (this.compareMode) {
      this.snackBar.open(
        'Compare mode on. Hover over a house to add it to the comparison.',
        'Got it!',
        {
          duration: 10000,
          verticalPosition: 'top',
        }
      );
    }
  }

  constructor(private dialog: MatDialog) {
    // Os valores iniciais representam um formulário "limpo".
    this.filterForm = this.fb.group({
      city: [''],
      typeOfBusiness: [''],
      propertyType: [''],
      wifi: [false],
      laundry: [false],
      priceFrom: [null],
      priceTo: [null],
      sellerType: [''],
    });
  }

  ngOnInit(): void {
    this.loadLocations();
    this.setupSearchListener();
    this.housingService.houseListUpdates
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Notificação recebida! Recarregando a lista de casas.');
        this.loadLocations();
      });
  }

  loadLocations(): void {
    this.housingService.getAllHousingLocations().subscribe({
      next: (list) => {
        this.housingLocationList = list.filter((h) => !h.deletedBy);
        // Aplica o filtro atual assim que os dados chegam
        this.filterResults();
      },
      error: (err) => console.error('Erro ao buscar os dados:', err),
    });
  }

  setupSearchListener(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(this.isEqual))
      .subscribe(() => {
        this.filterResults();
      });
  }

  isEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  filterResults(): void {
    const filters = this.filterForm.value;

    this.filteredLocationList = this.housingLocationList.filter((location) => {
      const matchesCity =
        !filters.city ||
        location.city.toLowerCase().includes(filters.city.toLowerCase());
      const matchesTransaction =
        !filters.typeOfBusiness ||
        location.typeOfBusiness === filters.typeOfBusiness;
      const matchesPropertyType =
        !filters.propertyType || location.propertyType === filters.propertyType;
      const matchesWifi = !filters.wifi || location.wifi;
      const matchesLaundry = !filters.laundry || location.laundry;
      const matchesPrice =
        (!filters.priceFrom || location.price >= filters.priceFrom) &&
        (!filters.priceTo || location.price <= filters.priceTo);
      const matchesSellerType =
        !filters.sellerType || location.sellerType === filters.sellerType;

      return (
        matchesCity &&
        matchesTransaction &&
        matchesPropertyType &&
        matchesWifi &&
        matchesLaundry &&
        matchesPrice &&
        matchesSellerType
      );
    });

    // Ordenação
    let filtered = [...this.filteredLocationList];

    if (this.orderBy === 'priceAsc') {
      filtered.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    } else if (this.orderBy === 'priceDesc') {
      filtered.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    } else if (this.orderBy === 'dateDesc') {
      filtered.sort((a, b) => {
        const timeA = new Date(a.listedDate).getTime();
        const timeB = new Date(b.listedDate).getTime();
        // Se a data for inválida (NaN), trate-a como mais antiga (0)
        return (isNaN(timeB) ? 0 : timeB) - (isNaN(timeA) ? 0 : timeA);
      });
    }

    this.filteredLocationList = filtered;

    this.pageIndex = 0;
    this.updatePagedList();
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.filterResults();
  }

  clearFilters(): void {
    this.filterForm.reset({
      city: '',
      transactionType: '',
      propertyType: '',
      wifi: false,
      laundry: false,
    });
  }

  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedList();
  }

  updatePagedList() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedLocationList = this.filteredLocationList.slice(start, end);
  }

  get currentUserRole(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.role || null;
  }

  openCreateHouse() {
    const allowedRoles = ['Admin', 'Manager', 'Owner', 'Real Estate Agency'];
    if (!allowedRoles.includes(this.currentUserRole ?? '')) {
      this.snackBar.open(
        'You do not have permission to perform this action.',
        'Close',
        {
          duration: 3000,
        }
      );
      return;
    }

    const dialogRef = this.dialog.open(CreateComponent, {
      width: '80%',
      minWidth: '800px',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadLocations();
    });
  }

  onOrderChange(order: 'relevance' | 'priceAsc' | 'priceDesc' | 'dateDesc') {
    this.orderBy = order;
    this.filterResults(); // Ou chame o método que atualiza a lista
  }

  /**
   * Atualiza o modo de visualização quando o usuário clica nos botões.
   * @param mode O novo modo: 'grid' ou 'list'.
   */
  onDisplayModeChange(mode: 'grid' | 'list'): void {
    if (mode) {
      this.displayMode = mode;
    }
  }
}
