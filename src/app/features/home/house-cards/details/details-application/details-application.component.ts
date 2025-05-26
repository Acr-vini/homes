// details-application.component.ts

import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

import { DetailsModalAplicationComponent } from '../../details/details-aplication-modal/details-application-modal.component';

@Component({
  selector: 'app-details-application',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
  ],
  templateUrl: './details-application.component.html',
  styleUrls: ['./details-application.component.scss'],
})
export class DetailsApplicationComponent {
  data: any; // Dados recebidos pela navegação com state

  constructor(private router: Router, private dialog: MatDialog) {
    this.data = this.router.getCurrentNavigation()?.extras.state;
    if (!this.data) {
      // Se acessar direto sem dados, redireciona para home
      this.router.navigate(['/home']);
    }
  }

  // Abre o modal para alterar data e hora
  changeDate() {
    const dialogRef = this.dialog.open(DetailsModalAplicationComponent, {
      data: {
        ...this.data,
        today: new Date(),
        visitHours: [
          '08:00',
          '09:00',
          '10:00',
          '11:00',
          '12:00',
          '13:00',
          '14:00',
          '15:00',
          '16:00',
          '17:00',
          '18:00',
          '19:00',
          '20:00',
        ],
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        // Atualiza os dados com o retorno do modal
        this.data.visitDate = result.visitDate;
        this.data.visitTime = result.visitTime;
        this.data.checkInDate = result.checkInDate;
        this.data.checkOutDate = result.checkOutDate;
      }
    });
  }

  // Alias para changeDate (pode deixar assim se quiser semântica separada)
  changeTime() {
    this.changeDate();
  }

  // Abre o modal para alterar check-in e check-out (reutiliza o mesmo modal)
  changeCheckIn() {
    this.dialog
      .open(DetailsModalAplicationComponent, {
        data: {
          ...this.data,
          today: new Date().toISOString().split('T')[0],
        },
      })
      .afterClosed()
      .subscribe((result) => {
        if (result) {
          this.data.checkInDate = result.checkInDate;
          this.data.checkOutDate = result.checkOutDate;
        }
      });
  }

  // Alias para changeCheckIn
  changeCheckOut() {
    this.changeCheckIn();
  }

  goToHome() {
    this.router.navigate(['/home']); // Navega para a rota /home
  }
}
