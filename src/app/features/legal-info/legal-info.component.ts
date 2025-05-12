import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';

@Component({
  selector: 'app-legal-info',
  standalone: true,
  imports: [CommonModule, MatCardModule],
  templateUrl: './legal-info.component.html',
  styleUrl: './legal-info.component.scss',
})
export class LegalInfoComponent {}
