import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Application } from '../interfaces/application.interface';

@Injectable({ providedIn: 'root' })
export class ApplicationService {
  // Injeta o HttpClient para fazer chamadas de rede
  private http = inject(HttpClient);

  // A URL agora aponta para o endpoint 'applications' no seu json-server
  private readonly apiUrl = 'http://localhost:3000/applications';

  /**
   * Busca todas as aplicações de um usuário específico do servidor.
   * @param userId O ID do usuário para filtrar as aplicações.
   */
  getByUser(userId: string): Observable<Application[]> {
    return this.http.get<Application[]>(`${this.apiUrl}?userId=${userId}`);
  }

  /**
   * Adiciona uma nova aplicação ao servidor.
   * @param application O objeto da aplicação a ser criado.
   */
  add(application: Omit<Application, 'id'>): Observable<Application> {
    return this.http.post<Application>(this.apiUrl, application);
  }

  /**
   * ATUALIZA uma aplicação existente no servidor.
   * @param id O ID da aplicação a ser atualizada.
   * @param updates Os campos a serem modificados.
   */
  update(id: string, updates: Partial<Application>): Observable<Application> {
    // Usa o método PATCH para enviar apenas os campos alterados,
    // garantindo que os dados sejam salvos permanentemente.
    return this.http.patch<Application>(`${this.apiUrl}/${id}`, updates);
  }

  /**
   * DELETA uma aplicação do servidor.
   * @param applicationId O ID da aplicação a ser deletada.
   */
  delete(applicationId: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${applicationId}`);
  }
}
