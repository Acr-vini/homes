// src/app/features/home/home-header/activity-date/activity-date.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import {
  ApplicationService,
  Application,
} from '../../../../core/services/application.service';
import { HousingService } from '../../../../core/services/housing.service';

@Component({
  selector: 'app-activity-date',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
  ],
  templateUrl: './activity-date.component.html',
  styleUrls: ['./activity-date.component.scss'],
})
export class ActivityDateComponent implements OnInit {
  applications: Array<Application & { photoUrl?: string }> = [];
  currentUserId: string | null = null;

  constructor(
    private applicationService: ApplicationService,
    private housingService: HousingService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserId = user?.id ?? null;
    if (!this.currentUserId) {
      return;
    }

    this.applications = this.applicationService.getByUser(this.currentUserId);

    this.applications.forEach((app) => {
      this.housingService
        .getHousingLocationById(app.houseId)
        .subscribe((location) => {
          app.photoUrl = location.imageUrl || location.photo;
        });
    });
  }

  viewDetails(app: Application): void {
    this.router.navigate(['/details-application'], {
      state: { ...app },
    });
  }
}
