import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HousingLocation } from '../../features/housinglocation';
import { Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { HousingFormValues } from '../../features/housingformvalues';

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

  createHousingLocation(
    housingLocation: HousingLocation
  ): Observable<HousingLocation> {
    return this.getAllHousingLocations().pipe(
      map((houses) => {
        const ids = houses
          .map((h) => parseInt(String(h.id), 10))
          .filter((id) => !isNaN(id));

        const maxId = Math.max(...ids, 0);
        const newId = String(maxId + 1);
        return { ...housingLocation, id: newId };
      }),
      switchMap((houseWithId) => {
        return this.http.post<HousingLocation>(this.baseUrl, houseWithId);
      })
    );
  }

  updateHousingLocation(
    id: string,
    housingLocation: HousingFormValues
  ): Observable<HousingLocation> {
    return this.http.put<HousingLocation>(
      `${this.baseUrl}/${id}`,
      housingLocation
    );
  }

  deleteHousingLocation(id: string): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  submitApplication(firstName: string, lastName: string, email: string): void {
    console.log('Application submitted:', { firstName, lastName, email });
  }
}
