export interface HousingFormValues {
  name: string;
  state: string;
  city: string;
  availableUnits: number;
  photo?: string;
  imageUrl?: string;
  wifi?: boolean;
  laundry?: boolean;
  editedBy?: string;
  typeOfBusiness: string;
}
