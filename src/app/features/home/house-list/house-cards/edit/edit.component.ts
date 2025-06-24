import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { City, State, IState } from 'country-state-city';
import { HousingService } from '../../../../../core/services/housing.service';
import { HousingLocation } from '../../../../../core/interfaces/housinglocation.interface';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
// CORREÇÃO: Adiciona 'finalize' à lista de imports do rxjs
import { map, Observable, startWith, finalize } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { NgxSpinnerModule, NgxSpinnerService } from 'ngx-spinner';

@Component({
  selector: 'app-edit',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatSnackBarModule,
    MatSelectModule,
    MatAutocompleteModule,
    MatCheckboxModule,
    MatTooltipModule, // O import duplicado foi removido
    NgxSpinnerModule,
  ],
  templateUrl: './edit.component.html',
  styleUrls: ['./edit.component.scss'],
})
export class EditComponent implements OnInit {
  // SECTION: Properties
  form!: FormGroup;
  stateControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });
  cityControl = new FormControl<string>('', {
    nonNullable: true,
    validators: [Validators.required],
  });

  allStates: IState[] = State.getStatesOfCountry('US');
  allCities: string[] = [];

  filteredStates!: Observable<IState[]>;
  filteredCities!: Observable<string[]>;

  imagePreview: string | ArrayBuffer | null = null;
  housingLocation!: HousingLocation;
  currentUserRole: string | null = null;
  canPerformActions = false;

  propertyTypes = [
    { value: 'apartment', viewValue: 'apartment' },
    { value: 'house', viewValue: 'house' },
    { value: 'terrain', viewValue: 'terrain' },
    { value: 'studio', viewValue: 'studio' },
  ];

  constructor(
    private fb: FormBuilder,
    private housingService: HousingService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
    private spinner: NgxSpinnerService,
    @Optional() public dialogRef?: MatDialogRef<EditComponent>,
    @Optional() @Inject(MAT_DIALOG_DATA) public data?: any
  ) {}

  // SECTION: Lifecycle Hooks
  ngOnInit(): void {
    const id = this.data?.id || this.route.snapshot.paramMap.get('id') || '';
    if (!id) {
      this.router.navigateByUrl('/');
      return;
    }

    this.spinner.show();
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    this.currentUserRole = user?.role || null;

    this.housingService.getHousingLocationById(id).subscribe({
      next: (house) => {
        if (!house) {
          this.router.navigateByUrl('/');
          return;
        }
        this.housingLocation = house;
        this.imagePreview = house.photo ?? null;

        // Lógica de permissão para exibir botões de ação
        const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
        const role = user?.role || null;
        const userId = user?.id;

        if (role === 'Admin' || role === 'Manager') {
          this.canPerformActions = true;
        } else if (role === 'Realtor' && house.ownerId === userId) {
          this.canPerformActions = true;
        } else {
          this.canPerformActions = false;
          this.snackBar.open(
            'You do not have permission to edit this property.',
            'Close',
            { duration: 4000 }
          );
          this.onCancel(); // Fecha o dialog ou redireciona
        }

        // CORREÇÃO: Lógica robusta para preencher o formulário, tratando dados inválidos.
        const stateName = this._findStateName(house.state); // Tenta encontrar o nome do estado a partir do código.
        this.stateControl.setValue(stateName || ''); // Se não encontrar, deixa o campo em branco.

        // Carrega as cidades apenas se o estado for válido.
        if (stateName) {
          this.allCities = City.getCitiesOfState('US', house.state).map(
            (c) => c.name
          );
          this.cityControl.setValue(house.city || '');
        } else {
          this.allCities = []; // Se o estado for inválido, a lista de cidades fica vazia.
          this.cityControl.setValue(''); // E o campo de cidade também.
        }

        // CORREÇÃO: O formulário agora é inicializado apenas uma vez e corretamente.
        this.form = this.fb.group({
          name: [house.name || '', Validators.required],
          state: this.stateControl,
          city: this.cityControl,
          availableUnits: [
            house.availableUnits || 0, // CORRIGIDO: Usar || 0 para manter o tipo numérico
            [Validators.required, Validators.min(1)],
          ],
          photo: [house.photo || ''],
          wifi: [house.wifi || false],
          laundry: [house.laundry || false],
          typeOfBusiness: [house.typeOfBusiness, Validators.required],
          propertyType: [house.propertyType, Validators.required],
          // O preço agora é carregado corretamente a partir dos dados da casa.
          price: [house.price || 0, [Validators.required, Validators.min(1)]],
        });

        this._setupFilters();
        this.spinner.hide();
      },
      error: () => {
        this.spinner.hide();
        this.router.navigateByUrl('/');
      },
    });
  }

  // SECTION: Form and Submission Logic
  onSubmit(): void {
    // CORREÇÃO 2: Adiciona uma verificação de segurança para garantir que os dados da casa foram carregados.
    if (!this.housingLocation) {
      this.snackBar.open('Cannot save, house data is not available.', 'Close', {
        duration: 3000,
      });
      return;
    }

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.spinner.show();

    const stateName = this.stateControl.value;
    const stateIsoCode = this._findStateIso(stateName);

    if (!stateIsoCode) {
      this.snackBar.open(
        'Invalid state selected. Please choose from the list.',
        'Close',
        { duration: 3000 }
      );
      this.spinner.hide();
      return;
    }

    const formValues = this.form.getRawValue();
    const currentUserId = JSON.parse(
      localStorage.getItem('currentUser') || 'null'
    )?.id;

    const updatedHouseData: Partial<HousingLocation> = {
      ...formValues,
      state: stateIsoCode,
      city: this.cityControl.value,
      price: Number(formValues.price),
      editedBy: currentUserId,
      updatedAt: new Date().toISOString(),
    };

    this.housingService
      // CORREÇÃO 1: O nome do método correto é 'updateHousingLocation'.
      .updateHousingLocation(this.housingLocation.id, updatedHouseData)
      .pipe(finalize(() => this.spinner.hide()))
      .subscribe({
        next: () => {
          this.snackBar.open('✅ House updated successfully!', 'Close', {
            duration: 3000,
          });
          // CORREÇÃO 3: Trata tanto o fechamento do modal quanto a navegação.
          if (this.dialogRef) {
            this.dialogRef.close(true);
          } else {
            this.router.navigateByUrl('/');
          }
        },
        error: (err) => {
          console.error('Failed to update house', err);
          this.snackBar.open(
            '❌ An error occurred while updating the house.',
            'Close',
            {
              duration: 3000,
            }
          );
        },
      });
  }

  onDelete(): void {
    // CORREÇÃO 2: Adiciona a mesma verificação de segurança aqui.
    if (!this.housingLocation) {
      this.snackBar.open(
        'Cannot delete, house data is not available.',
        'Close',
        { duration: 3000 }
      );
      return;
    }

    const snackBarRef = this.snackBar.open(
      'Are you sure you want to delete this house?',
      'Yes',
      { duration: 5000 }
    );
    snackBarRef.onAction().subscribe(() => {
      this.spinner.show();
      const currentUserId = JSON.parse(
        localStorage.getItem('currentUser') || 'null'
      )?.id;
      if (!currentUserId) {
        this.snackBar.open('❌ User not identified for deletion.', 'Close', {
          duration: 3000,
        });
        this.spinner.hide();
        return;
      }
      this.housingService
        .deleteHousingLocation(this.housingLocation.id, currentUserId)
        .subscribe({
          next: () => {
            this.snackBar.open('✅ House marked as deleted!', 'Close', {
              duration: 3000,
            });
            this.spinner.hide();

            this.housingService.notifyHouseListUpdated();

            // CORREÇÃO 3: Trata tanto o fechamento do modal quanto a navegação.
            if (this.dialogRef) {
              this.dialogRef.close(true);
            } else {
              this.router.navigateByUrl('/');
            }
          },
          error: () => {
            this.snackBar.open('❌ Failed to delete the house.', 'Close', {
              duration: 3000,
            });
            this.spinner.hide();
          },
        });
    });
  }

  onCancel(): void {
    // CORREÇÃO 3: Trata tanto o fechamento do modal quanto a navegação.
    if (this.dialogRef) {
      this.dialogRef.close(false);
    } else {
      this.router.navigateByUrl('/');
    }
  }

  // SECTION: Private Helpers and Utilities
  private _setupFilters(): void {
    this.filteredStates = this.stateControl.valueChanges.pipe(
      startWith<string>(this.stateControl.value),
      map((val: string) => this._filterStates(val))
    );

    // CORREÇÃO: Define o filtro de cidades UMA VEZ.
    this.filteredCities = this.cityControl.valueChanges.pipe(
      startWith<string>(this.cityControl.value || ''),
      map((value: string) => this._filterCities(value))
    );

    // CORREÇÃO: A inscrição em `stateControl` agora só atualiza a lista de cidades e reseta o campo.
    this.stateControl.valueChanges.subscribe((stateName: string) => {
      const iso = this._findStateIso(stateName);
      // Atualiza a fonte de dados para as cidades.
      this.allCities = iso
        ? City.getCitiesOfState('US', iso).map((c) => c.name)
        : [];
      // Reseta o campo da cidade, forçando o usuário a escolher uma nova.
      this.cityControl.setValue('');
    });
  }

  private _filterStates(value: string): IState[] {
    const filter = value.toLowerCase();
    return this.allStates.filter((s) => s.name.toLowerCase().includes(filter));
  }

  private _filterCities(value: string): string[] {
    const filter = value.toLowerCase();
    return this.allCities.filter((c) => c.toLowerCase().includes(filter));
  }

  private _findStateIso(name: string): string | undefined {
    return this.allStates.find((s) => s.name === name)?.isoCode;
  }

  private _findStateName(iso: string): string | undefined {
    return this.allStates.find((s) => s.isoCode === iso)?.name;
  }

  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) {
      const file = input.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result;
        this.form.patchValue({
          photo: reader.result as string,
        });
      };
      reader.readAsDataURL(file);
    }
  }

  trackByStateId(index: number, state: IState): string {
    return state.isoCode;
  }

  trackByCityId(index: number, city: string): string {
    return city;
  }
}
