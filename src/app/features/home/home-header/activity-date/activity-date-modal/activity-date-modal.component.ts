import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { Router } from '@angular/router';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-activity-date-modal',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatDatepickerModule,
    MatTooltipModule,
  ],
  templateUrl: './activity-date-modal.component.html',
  styleUrls: ['./activity-date-modal.component.scss'],
})
export class ActivityDateModalComponent implements OnInit {
  form!: FormGroup;
  today: Date = new Date();
  applyForm: any;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ActivityDateModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      visitDate: [this.data.visitDate || ''],
      visitTime: [this.data.visitTime || ''],
      checkInDate: [this.data.checkInDate || ''],
      checkOutDate: [this.data.checkOutDate || ''],
      // ...outros campos se necessário
    });
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
