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

  getHousingLocationById(id: number): Observable<HousingLocation> {
    return this.http.get<HousingLocation>(`${this.baseUrl}/${id}`);
  }

// Corrigindo erro de quando criar nova casa, ele redirecionar por conta de não ter id
createHousingLocation(housingLocation: HousingLocation): Observable<HousingLocation> {
  return this.getAllHousingLocations().pipe(
    map(houses => {
      // Converte todos os ids para número, ignorando undefined ou inválidos
      const ids = houses
        .map(h => Number(h.id))
        .filter(id => !isNaN(id)); // filtra só números válidos

      const maxId = Math.max(...ids, 0); // caso não haja nenhum, começa com 0
      return { ...housingLocation, id: maxId + 1 };
    }),
    switchMap(houseWithId => {
      return this.http.post<HousingLocation>(this.baseUrl, houseWithId);
    })
  );
}


  updateHousingLocation(id: number, housingLocation: HousingLocation): Observable<HousingLocation> {
    return this.http.put<HousingLocation>(`${this.baseUrl}/${id}`, housingLocation);
  }

  deleteHousingLocation(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  submitApplication(firstName: string, lastName: string, email: string): void {
    console.log('Application submitted:', { firstName, lastName, email });
  }
}
