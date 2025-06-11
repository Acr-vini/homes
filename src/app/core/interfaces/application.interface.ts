export interface Application {
  id: string;
  userId: string;
  houseId: string;
  typeOfBusiness: 'sell' | 'rent';
  houseName: string;
  city: string;
  state: string;
  visitDate?: string;
  visitTime?: string;
  checkInDate?: string;
  checkOutDate?: string;
  timestamp: string;
}
