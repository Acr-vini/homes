import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AdvertiserRating } from '../interfaces/advertiser-rating.interface';

@Injectable({
  providedIn: 'root',
})
export class AdvertiserRatingService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:3000/advertiserRatings';

  getRatingsByReviewer(reviewerId: string): Observable<AdvertiserRating[]> {
    return this.http.get<AdvertiserRating[]>(
      `${this.apiUrl}?reviewerId=${reviewerId}`
    );
  }

  /**
   * Adiciona uma nova avaliação de um anunciante.
   * @param ratingData Os dados da avaliação a serem salvos.
   */
  // ALTERADO: O tipo do payload agora omite 'id' E 'createdAt'
  addRating(
    ratingData: Omit<AdvertiserRating, 'id' | 'createdAt'>
  ): Observable<AdvertiserRating> {
    // Adiciona o timestamp no momento do envio para simular o backend
    const payloadWithTimestamp = {
      ...ratingData,
      createdAt: new Date().toISOString(),
    };

    return this.http.post<AdvertiserRating>(this.apiUrl, payloadWithTimestamp);
  }
}
