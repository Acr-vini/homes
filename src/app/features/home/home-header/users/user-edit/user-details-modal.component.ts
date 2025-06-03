import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { HousingService } from '../../../../../core/services/housing.service';

@Component({
  selector: 'app-user-details-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatIconModule],
  template: `
    <div class="user-details-modal">
      <h2 class="modal-title">
        <mat-icon
          style="vertical-align: middle; margin-right: 8px; color: var(--purpleBck);"
          >person</mat-icon
        >
        {{ data.user.name }}
      </h2>
      <div class="modal-section">
        <p>
          <mat-icon>email</mat-icon> <strong>Email:</strong>
          {{ data.user.email }}
        </p>
        <p *ngIf="data.user.location">
          <mat-icon>location_on</mat-icon> <strong>Location:</strong>
          {{ data.user.location }}
        </p>
        <p *ngIf="data.user.role">
          <mat-icon>badge</mat-icon> <strong>Role:</strong> {{ data.user.role }}
        </p>
      </div>
      <div class="modal-section">
        <h3><mat-icon>home</mat-icon> Houses created:</h3>
        <ul *ngIf="createdHouses.length; else noCreated">
          <li *ngFor="let house of createdHouses">
            <mat-icon
              style="font-size: 18px; color: var(--purpleBck); vertical-align: middle;"
              >house</mat-icon
            >
            <span style="margin-left: 6px;">{{ house.name }}</span>
          </li>
        </ul>
        <ng-template #noCreated>
          <p style="color: #888; margin-top: 8px;">
            No houses created by this user.
          </p>
        </ng-template>
      </div>
      <div class="modal-section">
        <h3><mat-icon>edit</mat-icon> Houses edited:</h3>
        <ul *ngIf="editedHouses.length; else noEdited">
          <li *ngFor="let house of editedHouses">
            <mat-icon
              style="font-size: 18px; color: var(--purpleBck); vertical-align: middle;"
              >edit</mat-icon
            >
            <span style="margin-left: 6px;">{{ house.name }}</span>
          </li>
        </ul>
        <ng-template #noEdited>
          <p style="color: #888; margin-top: 8px;">
            No houses edited by this user.
          </p>
        </ng-template>
      </div>
      <div class="modal-section">
        <h3><mat-icon>delete</mat-icon> Houses deleted:</h3>
        <ul *ngIf="deletedHouses.length; else noDeleted">
          <li *ngFor="let house of deletedHouses">
            <mat-icon
              style="font-size: 18px; color: #e53935; vertical-align: middle;"
              >delete</mat-icon
            >
            <span style="margin-left: 6px;">{{ house.name }}</span>
          </li>
        </ul>
        <ng-template #noDeleted>
          <p style="color: #888; margin-top: 8px;">
            No houses deleted by this user.
          </p>
        </ng-template>
      </div>
      <div class="modal-actions">
        <button mat-stroked-button color="primary" mat-dialog-close>
          Close
        </button>
      </div>
    </div>
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
export class UserDetailsModalComponent {
  createdHouses: any[] = [];
  editedHouses: any[] = [];
  deletedHouses: any[] = [];

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private housingService: HousingService
  ) {
    this.housingService.getAllHousingLocations().subscribe((houses) => {
      this.createdHouses = houses.filter((h) => h.createBy === data.user.id);
      this.editedHouses = houses.filter(
        (h) => h.editedBy === data.user.id && h.createBy !== data.user.id
      );
      this.deletedHouses = houses.filter((h) => h.deletedBy === data.user.id);
    });
  }
}
