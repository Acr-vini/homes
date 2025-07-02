import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private http = inject(HttpClient);
  private nominatimUrl = 'https://nominatim.openstreetmap.org/search';

  constructor() {}

  // Este método busca as coordenadas para uma cidade e estado
  getCoordinates(
    city: string,
    state: string
  ): Observable<{ lat: number; lon: number } | null> {
    const query = `${city}, ${state}`;
    const url = `${this.nominatimUrl}?q=${encodeURIComponent(
      query
    )}&format=json&limit=1`;

    return this.http.get<any[]>(url).pipe(
      map((response) => {
        // Se a API encontrar um resultado, retornamos a latitude e longitude
        if (response && response.length > 0) {
          return {
            lat: parseFloat(response[0].lat),
            lon: parseFloat(response[0].lon),
          };
        }
        // Se não encontrar, retornamos nulo
        return null;
      }),
      catchError((error) => {
        console.error('Geocoding API error:', error);
        // Em caso de erro na chamada, também retornamos nulo
        return of(null);
      })
    );
  }
}
