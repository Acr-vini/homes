import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Review } from '../interfaces/review.interface';

@Injectable({ providedIn: 'root' })
export class ReviewService {
  private apiUrl = 'http://localhost:3000/reviews';

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

  updateReview(id: string, review: Partial<Review>): Observable<Review> {
    // This method will perform a PATCH request to update the review
    return this.http.patch<Review>(`${this.apiUrl}/${id}`, review);
  }
}
