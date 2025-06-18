import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatIcon, MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-legal-info',
  standalone: true,
  imports: [CommonModule, MatCardModule, MatIconModule],
  templateUrl: './legal-info.component.html',
  styleUrl: './legal-info.component.scss',
})
export class LegalInfoComponent {}
