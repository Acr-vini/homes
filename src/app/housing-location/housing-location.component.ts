import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HousingLocation } from '../housinglocation';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-housing-location',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule
  ],
  templateUrl: './housing-location.html',
  styleUrls: ['./housing-location.component.scss'],
})
export class HousingLocationComponent {
  @Input() housingLocation!: HousingLocation;
}
