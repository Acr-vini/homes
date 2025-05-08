import { Component, OnInit } from '@angular/core';
import { RouterLink, RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { CommonModule } from '@angular/common';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterLink,
    RouterOutlet,
    CommonModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatSlideToggleModule,
    MatToolbarModule,
  ],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
})
export class AppComponent implements OnInit {
  title = 'homes';
  isDarkMode = false; // Variável para rastrear o estado do tema

  ngOnInit(): void {
    const darkMode = localStorage.getItem('darkMode') === 'true';
    this.applyTheme(darkMode);
  }

  toggleDarkMode(isDarkMode: boolean): void {
    this.isDarkMode = isDarkMode;
    localStorage.setItem('darkMode', String(isDarkMode));
    this.applyTheme(isDarkMode);
  }

  applyTheme(isDarkMode: boolean): void {
    const body = document.body;
    body.classList.remove('dark-theme', 'light-theme');
    body.classList.add(isDarkMode ? 'dark-theme' : 'light-theme');
  }
}
