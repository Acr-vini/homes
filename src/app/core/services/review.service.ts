import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Review } from '../interfaces/review.interface';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUrl = 'https://api-homes-7kt5olzh4q-rj.a.run.app/api/Review';

  constructor(private http: HttpClient) {}

  getReviewsByLocation(housingLocationId: string): Observable<Review[]> {
    return this.http.get<Review[]>(
      `${this.apiUrl}?housingLocationId=${housingLocationId}`
    );
  }

  addReview(review: Review): Observable<Review> {
    return this.http.post<Review>(this.apiUrl, review);
  }

  deleteReview(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
