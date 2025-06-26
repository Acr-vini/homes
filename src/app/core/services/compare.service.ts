import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { HousingLocation } from '../interfaces/housinglocation.interface';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root',
})
export class CompareService {
  private readonly MAX_COMPARE_ITEMS = 2;
  private compareList = new BehaviorSubject<HousingLocation[]>([]);
  compareList$ = this.compareList.asObservable();

  constructor(private snackBar: MatSnackBar) {}

  toggleCompare(house: HousingLocation): void {
    const currentList = this.getCompareList();
    const houseIndex = currentList.findIndex((h) => h.id === house.id);

    if (houseIndex > -1) {
      // Se a casa já está na lista, remova-a
      this.removeFromCompare(house.id);
    } else {
      // Se não, adicione-a (usando a lógica existente)
      this.addToCompare(house);
    }
  }

  getCompareList(): HousingLocation[] {
    return this.compareList.getValue();
  }

  addToCompare(house: HousingLocation): void {
    const currentList = this.getCompareList();
    if (currentList.find((h) => h.id === house.id)) {
      // A casa já está na lista, então não fazemos nada.
      // A lógica de remover já está no método toggleCompare.
      return;
    }

    if (currentList.length > 0) {
      const existingType = currentList[0].typeOfBusiness;
      if (house.typeOfBusiness !== existingType) {
        this.snackBar.open(
          `You can only compare houses of the same type (${existingType}s).`,
          'Close',
          { duration: 4000 }
        );
        return; // Impede a adição da casa incompatível
      }
    }

    if (currentList.length < this.MAX_COMPARE_ITEMS) {
      this.compareList.next([...currentList, house]);
    } else {
      this.snackBar.open(
        `You can only compare ${this.MAX_COMPARE_ITEMS} houses at a time.`,
        'Close',
        { duration: 3000 }
      );
    }
  }

  removeFromCompare(houseId: string): void {
    const updatedList = this.getCompareList().filter((h) => h.id !== houseId);
    this.compareList.next(updatedList);
  }

  clearCompareList(): void {
    this.compareList.next([]);
  }
}
