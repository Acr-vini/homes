import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface'; // Certifique-se que está importado
import { MatButtonModule } from '@angular/material/button';
import { MatListModule } from '@angular/material/list';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatListModule,
    MatDividerModule,
    MatProgressSpinnerModule,
    DatePipe,
  ],
  template: `
    <h2 mat-dialog-title>User Activity Details: {{ data.user.name }}</h2>
    <mat-dialog-content class="mat-typography">
      <div *ngIf="isLoading" class="loading-indicator">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading activity...</p>
      </div>

      <div *ngIf="!isLoading">
        <section *ngIf="createdHouses.length > 0">
          <h3>Houses Created by User</h3>
          <ul>
            <li *ngFor="let house of createdHouses; trackBy: trackByHouseId">
              {{ house.name }} (ID: {{ house.id }}) - Created on:
              {{ house.createdAt | date : 'short' }}
            </li>
          </ul>
        </section>
        <mat-divider
          *ngIf="
            createdHouses.length > 0 &&
            (editedHouses.length > 0 || deletedHouses.length > 0)
          "
        ></mat-divider>

        <section *ngIf="editedHouses.length > 0">
          <h3>Houses Edited by User</h3>
          <ul>
            <li *ngFor="let house of editedHouses; trackBy: trackByHouseId">
              {{ house.name }} (ID: {{ house.id }}) - Last edited on:
              {{ house.updatedAt | date : 'short' }}
            </li>
          </ul>
        </section>
        <mat-divider
          *ngIf="editedHouses.length > 0 && deletedHouses.length > 0"
        ></mat-divider>

        <section *ngIf="deletedHouses.length > 0">
          <h3>Houses Deleted by User</h3>
          <ul>
            <li *ngFor="let house of deletedHouses; trackBy: trackByHouseId">
              {{ house.name }} (ID: {{ house.id }}) - Deleted on:
              {{ house.deletedAt | date : 'short' }}
            </li>
          </ul>
        </section>

        <p
          *ngIf="
            !createdHouses.length &&
            !editedHouses.length &&
            !deletedHouses.length
          "
        >
          No house creation, edit, or deletion activity found for this user.
        </p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Close</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .user-details-modal {
        width: 100%;
        min-width: 340px;
        max-width: 500px;
        background: var(--cardBck, #fff);
        border-radius: 18px;
        box-shadow: 0 4px 18px #381c9e33;
        color: var(--text-color, #222);
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        padding: 2rem 2.5rem 2rem 2.5rem; /* Reduzi o padding-top */
        margin: 0;
      }
      .modal-title {
        font-size: 2rem;
        font-weight: bold;
        color: var(--titleAC, #381c9e);
        text-align: center;
        margin-bottom: 1rem; /* Menor espaço abaixo do título */
        margin-top: 0; /* Remove qualquer espaço acima */
        letter-spacing: 1px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 16px;
      }
      .modal-section {
        margin-bottom: 0.7rem; /* Menor espaço entre seções */
        font-size: 1.08rem;
      }
      .modal-section:last-child {
        margin-bottom: 0; /* Remove espaço extra após a última seção */
      }
      .modal-section mat-icon {
        margin-right: 10px;
      }
      .modal-section h3 mat-icon {
        margin-right: 8px;
      }
      .modal-section h3 {
        font-size: 1.15rem;
        font-weight: 600;
        margin-bottom: 0.3rem; /* Menor espaço abaixo do subtítulo */
        color: var(--purpleBck, #381c9e);
        display: flex;
        align-items: center;
        gap: 8px;
      }
      ul {
        padding-left: 0;
        list-style: none;
      }
      li {
        margin-bottom: 0.3rem;
        display: flex;
        align-items: center;
      }
      .modal-actions {
        display: flex;
        justify-content: center;
        margin-top: 1.5rem;
        padding: 0;
        background: transparent;
      }
      .modal-actions button {
        min-width: 120px;
        font-weight: 600;
        border-radius: 8px;
        background: var(--purpleWeak);
        color: #fff;
        box-shadow: 0 2px 8px #381c9e22;
        border: none;
        transition: background 0.2s, box-shadow 0.2s;
      }
      .modal-actions button:hover {
        background: var(--purpleBck);
        color: #fff;
        box-shadow: 0 4px 16px #381c9e33;
      }
      mat-icon {
        vertical-align: middle;
      }
      ::ng-deep .mat-mdc-dialog-surface {
        background: transparent !important;
        box-shadow: none !important;
        padding: 0 !important;
      }
    `,
  ],
})
export class UserDetailsModalComponent implements OnInit {
  createdHouses: HousingLocation[] = [];
  editedHouses: HousingLocation[] = [];
  deletedHouses: HousingLocation[] = [];
  isLoading = true;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private housingService: HousingService
  ) {}

  ngOnInit() {
    this.housingService.getAllHousingLocations().subscribe((houses) => {
      this.createdHouses = houses.filter(
        (h) => h.createBy === this.data.user.id
      );
      this.editedHouses = houses.filter(
        (h) =>
          h.editedBy === this.data.user.id && h.createBy !== this.data.user.id
      );
      this.deletedHouses = houses.filter(
        (h) => h.deletedBy === this.data.user.id
      );
      this.isLoading = false;
    });
  }

  trackByHouseId(index: number, house: HousingLocation): string {
    return house.id;
  }
}
