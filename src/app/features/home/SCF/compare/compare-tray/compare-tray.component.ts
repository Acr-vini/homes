import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Observable } from 'rxjs';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { CompareService } from '../../../../../core/services/compare.service';

@Component({
  selector: 'app-compare-tray',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatCardModule,
    MatTooltipModule,
  ],
  templateUrl: './compare-tray.component.html',
  styleUrls: ['./compare-tray.component.scss'],
})
export class CompareTrayComponent {
  private compareService = inject(CompareService);
  private router = inject(Router);

  compareList$: Observable<HousingLocation[]> =
    this.compareService.compareList$;

  removeFromCompare(houseId: string): void {
    this.compareService.removeFromCompare(houseId);
  }

  goToComparePage(): void {
    this.router.navigate(['/compare']);
  }
}
