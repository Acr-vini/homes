// Importe o FormBuilder e FormGroup
import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms'; // ALTERADO
import { CommonModule } from '@angular/common';
import { HousingService } from '../../../../core/services/housing.service';
import { HttpClientModule } from '@angular/common/http';
import { HouseCardsComponent } from '../../house-list/house-cards/house-cards-page/house-cards.component';
import { HousingLocation } from '../../../../core/interfaces/housinglocation.interface';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { RouterModule } from '@angular/router';
import { MatSelectModule } from '@angular/material/select';
import { MatCheckboxModule } from '@angular/material/checkbox'; // Vamos usar Checkbox
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { LegalInfoComponent } from '../../legal-info/legal-info-page/legal-info.component';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatDialog } from '@angular/material/dialog';
import { CreateComponent } from '../../../home/SCF/create/create.component';
import { Subject } from 'rxjs';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatSnackBar } from '@angular/material/snack-bar'; // Importa o MatSnackBar

@Component({
  selector: 'app-SCF',
  standalone: true,
  imports: [
    CommonModule,
    HouseCardsComponent,
    HttpClientModule,
    ReactiveFormsModule,
    RouterModule,
    MatSelectModule,
    MatCheckboxModule,
    MatButtonModule,
    MatIconModule,
    FormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    LegalInfoComponent,
    MatPaginatorModule,
    MatButtonToggleModule,
    MatTooltipModule,
    MatSidenavModule,
  ],
  templateUrl: './SCF.component.html',
  styleUrls: ['./SCF.component.scss'],
})
export class SCFComponent implements OnInit, OnDestroy {
  private housingService = inject(HousingService);
  private destroy$ = new Subject<void>();
  // NOVO: Injetamos o FormBuilder para facilitar a criação de formulários reativos.
  private fb = inject(FormBuilder);

  // Lista completa e lista filtrada
  housingLocationList: HousingLocation[] = [];
  filteredLocationList: HousingLocation[] = [];

  // NOVO: Substituímos o FormControl e as variáveis booleanas por um FormGroup único.
  // Isso centraliza toda a lógica de filtros em um só lugar.
  filterForm: FormGroup;

  // NOVO: Opções para os nossos filtros do tipo select/toggle
  propertyTypes = ['No Preference', 'house', 'apartment', 'terrain', 'studio'];

  pageSize = 20;
  pageIndex = 0;
  pagedLocationList: HousingLocation[] = [];

  constructor(private dialog: MatDialog, private snackBar: MatSnackBar) {
    // NOVO: Inicializamos o formulário no construtor.
    // Os valores iniciais representam um formulário "limpo".
    this.filterForm = this.fb.group({
      city: [''], // antigo filterControl
      typeOfBusiness: [''],
      propertyType: [''], // Ex: 'Apartamento', 'Casa'
      wifi: [false], // antigo filterWifi
      laundry: [false], // antigo filterLaundry
    });
  }

  ngOnInit(): void {
    this.loadLocations();
    this.setupSearchListener();
    this.housingService.houseListUpdates
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        console.log('Notificação recebida! Recarregando a lista de casas.');
        this.loadLocations();
      });
  }

  loadLocations(): void {
    this.housingService.getAllHousingLocations().subscribe({
      next: (list) => {
        this.housingLocationList = list.filter((h) => !h.deletedBy);
        // Aplica o filtro atual assim que os dados chegam
        this.filterResults();
      },
      error: (err) => console.error('Erro ao buscar os dados:', err),
    });
  }

  // ALTERADO: Agora escutamos as mudanças do FormGroup como um todo.
  setupSearchListener(): void {
    this.filterForm.valueChanges
      .pipe(debounceTime(400), distinctUntilChanged(this.isEqual)) // Usamos debounce para não pesquisar a cada tecla
      .subscribe(() => {
        this.filterResults();
      });
  }

  // NOVO: Função para comparar objetos (útil no distinctUntilChanged)
  isEqual(a: any, b: any): boolean {
    return JSON.stringify(a) === JSON.stringify(b);
  }

  // ALTERADO: A lógica de filtro agora lê os valores do `filterForm`.
  filterResults(): void {
    // Pegamos todos os valores do formulário de uma vez.
    const filters = this.filterForm.value;
    const term = (filters.city ?? '').toLowerCase();

    this.filteredLocationList = this.housingLocationList.filter(
      (location: HousingLocation) => {
        // A lógica de filtro agora é mais legível e centralizada.
        const matchesCity = location.city.toLowerCase().includes(term);

        // Se um tipo de transação foi selecionado, filtra por ele. Senão, ignora.
        const matchesTransaction =
          !filters.typeOfBusiness ||
          location.typeOfBusiness === filters.typeOfBusiness;

        // Se um tipo de imóvel foi selecionado, filtra por ele. Senão, ignora.
        const matchesPropertyType =
          !filters.propertyType ||
          location.propertyType === filters.propertyType;

        const matchesWifi = !filters.wifi || location.wifi;
        const matchesLaundry = !filters.laundry || location.laundry;

        // O imóvel só aparece se passar em TODAS as condições.
        return (
          matchesCity &&
          matchesTransaction &&
          matchesPropertyType &&
          matchesWifi &&
          matchesLaundry
        );
      }
    );
    this.pageIndex = 0; // Reseta a paginação para a primeira página
    this.updatePagedList();
  }

  // A função onSubmit não é mais estritamente necessária se o filtro é reativo,
  // mas podemos mantê-la por acessibilidade (ex: pressionar Enter no campo de texto).
  onSubmit(event: Event): void {
    event.preventDefault();
    this.filterResults();
  }

  // NOVO: Método para limpar o formulário e re-executar a busca.
  clearFilters(): void {
    this.filterForm.reset({
      city: '',
      transactionType: '',
      propertyType: '',
      wifi: false,
      laundry: false,
    });
    // A busca será re-executada automaticamente pelo `valueChanges`
  }

  // Seus outros métodos continuam iguais...
  onPageChange(event: PageEvent) {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.updatePagedList();
  }

  updatePagedList() {
    const start = this.pageIndex * this.pageSize;
    const end = start + this.pageSize;
    this.pagedLocationList = this.filteredLocationList.slice(start, end);
  }

  get currentUserRole(): string | null {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    return user?.role || null;
  }

  openCreateHouse() {
    if (
      this.currentUserRole !== 'Admin' &&
      this.currentUserRole !== 'Manager' &&
      this.currentUserRole !== 'Realtor'
    ) {
      this.snackBar.open(
        'You do not have permission to perform this action.',
        'Close',
        {
          duration: 3000,
        }
      );
      return; // Impede a abertura do dialog
    }

    const dialogRef = this.dialog.open(CreateComponent, {
      width: '80%',
      minWidth: '800px',
      disableClose: true,
      autoFocus: false,
    });

    dialogRef.afterClosed().subscribe(() => {
      this.loadLocations();
    });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
