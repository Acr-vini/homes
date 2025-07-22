import {
  Component,
  Input,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import * as L from 'leaflet';

@Component({
  selector: 'app-housing-map',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './housing-map.component.html',
  styleUrls: ['./housing-map.component.scss'],
})
export class HousingMapComponent implements OnChanges {
  @Input() locations: HousingLocation[] = [];
  private router = inject(Router);
  private map!: L.Map;
  private markersLayer = L.featureGroup();

  // Ícone personalizado para os marcadores
  private readonly customIcon = L.icon({
    iconUrl: 'assets/pin2.webp', // ícone de pino dos cards
    iconSize: [30, 30], // Tamanho do ícone
    iconAnchor: [15, 41], // Ponto do ícone que corresponde à localização do marcador
    popupAnchor: [0, -41], // Ponto a partir do qual o popup deve abrir
  });

  ngOnChanges(changes: SimpleChanges): void {
    // Inicializa o mapa na primeira vez ou atualiza os marcadores se a lista mudar
    if (changes['locations']) {
      if (!this.map) {
        this.initMap();
      }
      this.updateMarkers();
    }
  }

  private initMap(): void {
    // Centraliza o mapa nos EUA como padrão
    this.map = L.map('housing-map-container').setView([39.8283, -98.5795], 4);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);

    this.markersLayer.addTo(this.map);
  }

  private updateMarkers(): void {
    // Limpa marcadores antigos
    this.markersLayer.clearLayers();

    if (!this.locations || this.locations.length === 0) {
      return;
    }

    this.locations.forEach((location) => {
      if (location.latitude && location.longitude) {
        const marker = L.marker([location.latitude, location.longitude], {
          icon: this.customIcon,
        }).addTo(this.markersLayer);

        // Adiciona um popup que, ao ser clicado, navega para os detalhes
        marker.bindPopup(
          `<b>${location.name}</b><br><a href="/details/${location.id}" style="color: var(--purpleBck); text-decoration: underline;">View Details</a>`
        );

        // Adiciona um evento de clique no marcador para navegação
        marker.on('click', () => {
          this.router.navigate(['/details', location.id]);
        });
      }
    });

    // Ajusta o zoom para mostrar todos os marcadores
    if (this.markersLayer.getLayers().length > 0) {
      this.map.fitBounds(this.markersLayer.getBounds().pad(0.1));
    }
  }
}
