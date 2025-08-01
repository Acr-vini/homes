import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-legal-info',
  standalone: true,
  imports: [MatCardModule, MatIconModule],
  templateUrl: './legal-info.component.html',
  styleUrl: './legal-info.component.scss',
})
export class LegalInfoComponent {}
