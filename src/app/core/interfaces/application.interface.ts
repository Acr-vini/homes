export interface Application {
  id: string;
  houseId: string;
  userId: string;
  name: string;
  email: string;
  phone: string;
  location: string;
  typeOfBusiness: 'sell' | 'rent';
  houseName: string;
  city: string;
  state: string;
  visitDate?: string;
  visitTime?: string;
  checkInDate?: string;
  checkOutDate?: string;
  timestamp: string;

  // --- CAMPOS PARA A LÓGICA DE AVALIAÇÃO ---
  hasBeenReviewed?: boolean;
  advertiserId?: string;
  advertiserName?: string;
}
