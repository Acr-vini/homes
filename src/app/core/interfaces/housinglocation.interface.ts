export interface HousingLocation {
  id: string;
  name: string;
  city: string;
  state: string;
  photo?: string;
  imageUrl?: string;
  availableUnits: number;
  wifi: boolean;
  laundry: boolean;
  createBy?: string;
  editedBy?: string;
  deletedBy?: string;
  typeOfBusiness: 'sell' | 'rent';
}
