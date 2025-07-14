import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class GeocodingService {
  private apiUrl = 'https://nominatim.openstreetmap.org/search';

  constructor(private http: HttpClient) {}

  getCoordinates(
    address: string
  ): Observable<{ lat: number; lon: number } | null> {
    const params = new HttpParams()
      .set('q', address)
      .set('format', 'json')
      .set('limit', '1');

    return this.http.get<any[]>(this.apiUrl, { params }).pipe(
      map((response) => {
        if (response && response.length > 0) {
          return {
            lat: parseFloat(response[0].lat),
            lon: parseFloat(response[0].lon),
          };
        }
        return null;
      }),
      catchError(() => of(null))
    );
  }
}
