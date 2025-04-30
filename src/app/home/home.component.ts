import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HousingService } from '../housing.service';
import { HttpClientModule } from '@angular/common/http';
import { HousingLocationComponent } from '../housing-location/housing-location.component';
import { HousingLocation } from '../housinglocation';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { RouterModule } from '@angular/router';

import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

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
    MatIconModule

  ],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private housingService = inject(HousingService);
  housingLocationList: HousingLocation[] = [];
  filteredLocationList: HousingLocation[] = [];

  filterControl = new FormControl('');

  ngOnInit(): void {
    this.loadLocations();
    this.smartSearch();
  }

  loadLocations(): void {
    this.housingService.getAllHousingLocations().subscribe({
      next: (housingLocationList) => {
        this.housingLocationList = housingLocationList;
        this.filteredLocationList = housingLocationList;
      },
      error: (err) => {
        console.error('Erro ao buscar os dados:', err);
      }
    });
  }

  smartSearch(): void {
    this.filterControl.valueChanges
      .pipe(debounceTime(300), distinctUntilChanged())
      .subscribe((value) => {
        this.filterResults(value ?? '');
      });
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.filterResults(this.filterControl.value ?? '');
  }

  filterResults(text: string): void {
    if (!text) {
      this.filteredLocationList = this.housingLocationList;
    } else {
      this.filteredLocationList = this.housingLocationList.filter(
        (location) =>
          location.city.toLowerCase().includes(text.toLowerCase())
      );
    }
  }
}
