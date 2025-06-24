import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CompareService } from '../../../../../core/services/compare.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { Observable } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { Router } from '@angular/router';

@Component({
  selector: 'app-compare',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule, MatButtonModule],
  templateUrl: './compare.component.html',
  styleUrls: ['./compare.component.scss'],
})
export class CompareComponent {
  compareService = inject(CompareService);
  router = inject(Router);
  compareList$: Observable<HousingLocation[]> =
    this.compareService.compareList$;

  clearAndGoBack() {
    this.compareService.clearCompareList();
    this.router.navigate(['/']);
  }
}
