import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HousingLocation } from './housinglocation';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';


@Injectable({
  providedIn: 'root',
})
export class HousingService {
  private readonly baseUrl = 'http://localhost:3000/locations';

  constructor(private http: HttpClient) {}

  getAllHousingLocations(): Observable<HousingLocation[]> {
    return this.http.get<HousingLocation[]>(this.baseUrl);
  }

  getHousingLocationById(id: string): Observable<HousingLocation> {
    return this.http.get<HousingLocation>(`${this.baseUrl}/${id}`);
  }

// Corrigindo erro de quando criar nova casa, ele redirecionar por conta de não ter id
createHousingLocation(housingLocation: HousingLocation): Observable<HousingLocation> {
  return this.getAllHousingLocations().pipe(
    map(houses => {
      // Converte todos os ids para número com parseInt, ignorando inválidos
      const ids = houses
        .map(h => parseInt(String(h.id), 10))
        .filter(id => !isNaN(id)); // apenas números válidos

      const maxId = Math.max(...ids, 0); // começa com 0 se estiver vazio
      const newId = String(maxId + 1);  // GERA COMO STRING
      return { ...housingLocation, id: newId };
    }),
    switchMap(houseWithId => {
      return this.http.post<HousingLocation>(this.baseUrl, houseWithId);
    })
  );
}


  updateHousingLocation(id: string, housingLocation: HousingLocation): Observable<HousingLocation> {
  return this.http.put<HousingLocation>(`${this.baseUrl}/${id}`, housingLocation);
}

deleteHousingLocation(id: string): Observable<void> {
  return this.http.delete<void>(`${this.baseUrl}/${id}`);
}

  submitApplication(firstName: string, lastName: string, email: string): void {
    console.log('Application submitted:', { firstName, lastName, email });
  }
}
