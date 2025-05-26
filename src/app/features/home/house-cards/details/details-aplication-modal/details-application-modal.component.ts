import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatOptionModule } from '@angular/material/core';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { Router } from '@angular/router'; // ✅ Importação do Router adicionada

@Component({
  selector: 'app-details-modal-aplication',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatOptionModule,
    MatCardModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatIconModule,
  ],
  templateUrl: './details-application-modal.component.html',
  styleUrls: ['./details-application-modal.component.scss'],
})
export class DetailsModalAplicationComponent {
  form: FormGroup;
  today: Date = new Date();
  applyForm: any;

  // ✅ Constructor recebe Router e corrigimos a vírgula
  constructor(
    public dialogRef: MatDialogRef<DetailsModalAplicationComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private fb: FormBuilder,
    private router: Router
  ) {
    // ✅ Inicializa o formulário baseado no tipo de negociação
    if (data.typeOfBusiness === 'sell') {
      this.form = this.fb.group({
        visitDate: [
          data.visitDate ? new Date(data.visitDate) : null,
          Validators.required,
        ],
        visitTime: [data.visitTime, Validators.required],
      });
    } else {
      this.form = this.fb.group({
        checkInDate: [
          data.checkInDate ? new Date(data.checkInDate) : null,
          Validators.required,
        ],
        checkOutDate: [
          data.checkOutDate ? new Date(data.checkOutDate) : null,
          Validators.required,
        ],
      });
    }
  }

  // ✅ Salva os dados e fecha o modal, retornando os dados preenchidos
  save() {
    if (this.form.valid) {
      this.dialogRef.close(this.form.value);
    }
  }

  // ✅ Fecha o modal sem salvar
  close() {
    this.dialogRef.close();
  }
}
