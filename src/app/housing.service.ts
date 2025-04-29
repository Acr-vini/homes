import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HousingLocation } from './housinglocation';
import { Observable } from 'rxjs';

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

  createHousingLocation(housingLocation: HousingLocation): Observable<HousingLocation> {
    return this.http.post<HousingLocation>(this.baseUrl, housingLocation);
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
