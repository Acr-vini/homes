import { Component, OnInit } from '@angular/core';
import { HousingService } from '../../../../core/services/housing.service';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import { HouseCardsComponent } from '../../../home/house-list/house-cards/house-cards-page/house-cards.component';

import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-house-list',
  templateUrl: './house-list.component.html',
  styleUrls: ['./house-list.component.scss'],
  standalone: true,
  imports: [NgxSpinnerModule, HouseCardsComponent],
})
export class HouseListComponent implements OnInit {
  houses: HousingLocation[] = [];

  constructor(
    private housingService: HousingService,
    private spinner: NgxSpinnerService
  ) {}

  ngOnInit(): void {
    this.spinner.show();
    this.housingService.getAllHousingLocations().subscribe({
      next: (houses) => {
        this.houses = houses;
        this.spinner.hide();
      },
      error: () => this.spinner.hide(),
    });
  }
}
