export interface HousingLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  photo: string;
  availableUnits: number;
  wifi: boolean;
  laundry: boolean;
  typeOfBusiness: 'rent' | 'sell';
  createBy?: string;
  editedBy?: string;
  deletedBy?: string;
  isFavorite?: boolean;
  createdAt?: string | Date; // Adicionado - pode ser string (ISO) ou Date
  updatedAt?: string | Date; // Adicionado
  deletedAt?: string | Date; // Adicionado
}
