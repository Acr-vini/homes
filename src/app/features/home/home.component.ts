import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HousingService } from '../../core/services/housing.service';
import { HttpClientModule } from '@angular/common/http';
import { HousingLocationComponent } from '../housing-location/housing-location.component';
import { HousingLocation } from '../housinglocation';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LegalInfoComponent } from '../../features/legal-info/legal-info.component';
import { MatPaginatorModule } from '@angular/material/paginator';
import { PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../create/create.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule,
    HousingLocationComponent,
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
  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private housingService = inject(HousingService);

  // Lista completa e lista filtrada
  housingLocationList: HousingLocation[] = [];
  filteredLocationList: HousingLocation[] = [];

  // Controle de texto e filtros booleanos
  filterControl = new FormControl('');
  filterAvailable = false;
  filterWifi = false;
  filterLaundry = false;
  userRole: any;

  pageSize = 20;
  pageIndex = 0;
  pagedLocationList: HousingLocation[] = [];

  private dialog = inject(MatDialog);

  ngOnInit(): void {
    this.loadLocations();
    this.setupSearchListener();
  }

  loadLocations(): void {
    this.housingService.getAllHousingLocations().subscribe({
      next: (list) => {
        // Só mostra casas que NÃO foram deletadas
        this.housingLocationList = list.filter((h) => !h.deletedBy);
        this.filteredLocationList = this.housingLocationList;
        this.updatePagedList();
      },
      error: (err) => console.error('Erro ao buscar os dados:', err),
    });
  }

  setupSearchListener(): void {
    this.filterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe(() => {
        this.filterResults();
      });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.filterResults();
  }

  filterResults(): void {
    const term = (this.filterControl.value ?? '').toLowerCase();

    this.filteredLocationList = this.housingLocationList.filter(
      (location: HousingLocation) => {
        const matchesText = location.city.toLowerCase().includes(term);
        const matchesAvailable =
          !this.filterAvailable || location.availableUnits > 0;
        const matchesWifi = !this.filterWifi || location.wifi;
        const matchesLaundry = !this.filterLaundry || location.laundry;

        return matchesText && matchesAvailable && matchesWifi && matchesLaundry;
      }
    );
    this.pageIndex = 0;
    this.updatePagedList();
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
    this.dialog.open(CreateComponent, {
      width: '500px',
      disableClose: true,
      autoFocus: false,
    });
  }
}
