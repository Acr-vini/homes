import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

import { provideNativeDateAdapter } from '@angular/material/core';

@Component({
  selector: 'app-activity-date-modal',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatCardModule,
    MatTooltipModule,
    MatButtonModule,
    MatIconModule,
    MatDatepickerModule
],
  templateUrl: './activity-date-modal.component.html',
  styleUrls: ['./activity-date-modal.component.scss'],

  providers: [provideNativeDateAdapter()],
})
export class ActivityDateModalComponent implements OnInit {
  form!: FormGroup;
  today: string = new Date().toISOString().split('T')[0];

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<ActivityDateModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      name: [this.data.name || '', Validators.required],
      email: [this.data.email || '', [Validators.required, Validators.email]],
      phone: [this.data.phone || '', Validators.required],
      visitDate: [this.data.visitDate ? new Date(this.data.visitDate) : ''],
      visitTime: [this.data.visitTime || ''],
      checkInDate: [
        this.data.checkInDate ? new Date(this.data.checkInDate) : '',
      ],
      checkOutDate: [
        this.data.checkOutDate ? new Date(this.data.checkOutDate) : '',
      ],
    });

    if (this.data.typeOfBusiness === 'rent') {
      this.form.get('checkInDate')?.setValidators(Validators.required);
      this.form.get('checkOutDate')?.setValidators(Validators.required);
      this.form.get('checkInDate')?.updateValueAndValidity();
      this.form.get('checkOutDate')?.updateValueAndValidity();
    } else if (this.data.typeOfBusiness === 'sell') {
      this.form.get('visitDate')?.setValidators(Validators.required);
      this.form.get('visitTime')?.setValidators(Validators.required);
      this.form.get('visitDate')?.updateValueAndValidity();
      this.form.get('visitTime')?.updateValueAndValidity();
    }
  }

  save() {
    if (this.form.valid) {
      const formData = { ...this.form.value };
      if (formData.visitDate instanceof Date) {
        formData.visitDate = formData.visitDate.toISOString().split('T')[0];
      }
      if (formData.checkInDate instanceof Date) {
        formData.checkInDate = formData.checkInDate.toISOString().split('T')[0];
      }
      if (formData.checkOutDate instanceof Date) {
        formData.checkOutDate = formData.checkOutDate
          .toISOString()
          .split('T')[0];
      }
      this.dialogRef.close(formData);
    } else {
      this.form.markAllAsTouched();
      console.log('Form is invalid:', this.form.errors, this.form.value);
    }
  }

  close() {
    this.dialogRef.close();
  }
}
