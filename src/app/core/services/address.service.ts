import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

// Interface para a resposta da API
export interface ZipCodeResponse {
  places: {
    'place name': string;
    state: string;
    'state abbreviation': string;
    latitude: string;
    longitude: string;
  }[];
}

// Interface para os dados que vamos usar
export interface AddressInfo {
  city: string;
  state: string;
  state_code: string;
  latitude: number;
  longitude: number;
}

@Injectable({
  providedIn: 'root',
})
export class addressService {
  private http = inject(HttpClient);
  // Esta URL será interceptada e reescrita pelo proxy
  private readonly API_URL = '/zip-api/us/';

  getAddressByZipCode(zipCode: string): Observable<AddressInfo | null> {
    return this.http.get<ZipCodeResponse>(`${this.API_URL}${zipCode}`).pipe(
      map((response) => {
        if (response && response.places && response.places.length > 0) {
          const place = response.places[0];
          return {
            city: place['place name'],
            state: place.state,
            state_code: place['state abbreviation'],
            latitude: parseFloat(place.latitude),
            longitude: parseFloat(place.longitude),
          };
        }
        return null;
      }),
      catchError((error) => {
        console.error('AddressService API call failed:', error);
        return of(null);
      })
    );
  }
}
