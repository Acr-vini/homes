import { Component, inject, OnInit } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HousingService } from '../housing.service';
import { HousingLocationComponent } from '../housing-location/housing-location.component';
import { HousingLocation } from '../housinglocation';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HousingLocationComponent],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
})
export class HomeComponent implements OnInit {
  private housingService = inject(HousingService);
  housingLocationList: HousingLocation[] = [];
  filteredLocationList: HousingLocation[] = [];

  // 🔹 Aqui você já tem o FormControl
  filterControl = new FormControl('');

  ngOnInit(): void {
    this.loadLocations();
    this.smartSearch();

  }

  loadLocations() {
    this.housingService.getAllHousingLocations().then((housingLocationList) => {
      this.housingLocationList = housingLocationList;
      this.filteredLocationList = housingLocationList;
    });
  }
  smartSearch() {
    this.filterControl.valueChanges
    .pipe(
      debounceTime(300),
      distinctUntilChanged()
    )
    .subscribe((value) => {
      this.filterResults(value ?? '');
    });
  }
  // 🔹 Esse é o método que você deve adicionar!
  onSubmit(event: Event) {
    event.preventDefault(); // evita recarregamento da página
    this.filterResults(this.filterControl.value ?? '');
  }

  // 🔹 Método que filtra a lista
  filterResults(text: string) {
    if (!text) {
      this.filteredLocationList = this.housingLocationList;
    } else {
      this.filteredLocationList = this.housingLocationList.filter(
        location => location.city.toLowerCase().includes(text.toLowerCase())
      );
    }
  }
}
