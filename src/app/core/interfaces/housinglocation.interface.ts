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
  propertyType: 'house' | 'apartment' | 'terrain' | 'studio';
  price: number;
  sellerType: 'Owner' | 'Real Estate Agency';
  createBy?: string;
  editedBy?: string;
  deletedBy?: string;
  isFavorite?: boolean;
  createdAt?: string | Date;
  updatedAt?: string | Date;
  deletedAt?: string | Date;
  deleted: boolean;
  ownerId: string;
  listedDate: string;
}
