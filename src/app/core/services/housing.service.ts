import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { HousingLocation } from '../interfaces/housinglocation.interface';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class HousingService {
  private readonly baseUrl = 'http://localhost:3000/locations';

  // **PASSO 1.1**: Crie o Subject privado e o Observable público
  // O Subject é quem envia a notificação.
  private houseListUpdated$ = new Subject<void>();

  // O Observable é quem os componentes vão "escutar".
  get houseListUpdates(): Observable<void> {
    return this.houseListUpdated$.asObservable();
  }

  constructor(private http: HttpClient) {}

  // **PASSO 1.2**: Crie um método para disparar a notificação
  notifyHouseListUpdated(): void {
    console.log('Serviço notificando que a lista de casas mudou...');
    this.houseListUpdated$.next();
  }

  /**
   * Busca todas as casas que NÃO foram marcadas como deletadas.
   */
  getAllHousingLocations(): Observable<HousingLocation[]> {
    // Filtra para retornar apenas os itens onde 'deleted' é 'false'.
    return this.http.get<HousingLocation[]>(`${this.baseUrl}?deleted=false`);
  }

  /**
   * Busca uma única casa pelo seu ID.
   */
  getHousingLocationById(id: string): Observable<HousingLocation> {
    return this.http.get<HousingLocation>(`${this.baseUrl}/${id}`);
  }

  /**
   * Cria uma nova casa e garante que ela seja visível na lista principal.
   */
  createHousingLocation(
    housingLocationData: Omit<HousingLocation, 'id'>
  ): Observable<HousingLocation> {
    const payload = {
      ...housingLocationData,
      deleted: false, // Garante que a nova casa já seja criada como ativa.
    };
    return this.http.post<HousingLocation>(this.baseUrl, payload);
  }

  /**
   * Atualiza os dados de uma casa existente.
   */
  updateHousingLocation(
    id: string,
    housingUpdates: Partial<HousingLocation> // Aceita atualizações parciais
  ): Observable<HousingLocation> {
    // Usa PATCH para atualizar apenas os campos enviados, sem risco de apagar outros.
    return this.http.patch<HousingLocation>(
      `${this.baseUrl}/${id}`,
      housingUpdates
    );
  }

  /**
   * Realiza um "soft delete", marcando a casa como deletada no banco de dados.
   */
  deleteHousingLocation(
    id: string,
    userId: string
  ): Observable<HousingLocation> {
    const payload = {
      deleted: true,
      deletedBy: userId,
      deletedAt: new Date().toISOString(),
    };
    return this.http.patch<HousingLocation>(`${this.baseUrl}/${id}`, payload);
  }

  /**
   * Método legado para submissão de aplicação.
   */
  submitApplication(firstName: string, lastName: string, email: string): void {
    console.log('Application submitted:', { firstName, lastName, email });
  }

  getAllLocationsWithHistory(): Observable<HousingLocation[]> {
    // Note que esta chamada não tem o filtro '?deleted=false'
    return this.http.get<HousingLocation[]>(this.baseUrl);
  }
}
