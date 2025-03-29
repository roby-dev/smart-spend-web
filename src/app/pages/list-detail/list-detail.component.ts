// list-detail/list-detail.component.ts
import { CommonModule, Location } from '@angular/common';
import { Component, ElementRef, OnInit, Signal, ViewChild, WritableSignal, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../core/services/database.service';
import { CompraDetalle } from '../../core/models/compra-detalle';

@Component({
  selector: 'app-list-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './list-detail.component.html',
  styleUrls: ['./list-detail.component.css']
})
export class ListDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private location = inject(Location);
  private dbService = inject(DatabaseService);

  compraId = signal<number | null>(null);
  listName = signal<string>('Cargando...');
  listItems = signal<CompraDetalle[]>([]);
  totalAmount = signal<string>('0.00');
  isLoading = signal<boolean>(true);

  isEditingTitle = signal<boolean>(false);
  editedListName = signal<string>('');

  showAddModal = signal<boolean>(false);
  newItem = {
    nombre: '',
    precio: 0
  };

  ngOnInit(): void {
    this.route.paramMap.subscribe(paramMap => {
      const id = paramMap.get('id');
      if (id) {
        const numId = parseInt(id, 10);
        this.compraId.set(numId);
        this.loadCompraDetails(numId);
      } else {
        this.router.navigate(['/main/dashboard']);
      }
    });
  }

  async loadCompraDetails(id: number): Promise<void> {
    try {
      this.isLoading.set(true);
      await this.dbService.initDatabase();

      // Cargar datos de la compra
      const compra = await this.dbService.getCompraById(id);
      if (!compra) {
        this.router.navigate(['/main/dashboard']);
        return;
      }

      this.listName.set(compra.titulo);

      // Cargar detalles de la compra
      const detalles = await this.dbService.getDetallesByCompraId(id);
      this.listItems.set(detalles.map(detalle => ({
        ...detalle,
        fecha: this.formatDate(detalle.fecha),
        isEditing: signal(false) // Cambiado a signal
      })));

      // Calcular el total
      const total = detalles.reduce((sum, detalle) => sum + detalle.precio, 0);
      this.totalAmount.set(total.toFixed(2));

    } catch (error) {
      console.error('Error al cargar detalles:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  goBack(): void {
    this.location.back();
  }

  toggleAddModal(): void {
    this.showAddModal.update(value => !value);
    if (!this.showAddModal()) {
      this.newItem.nombre = '';
      this.newItem.precio = 0;
    }
  }

  async addNewItem(): Promise<void> {
    if (!this.newItem.nombre.trim() || this.newItem.precio < 0 || !this.compraId()) return;

    try {
      const now = new Date();
      const newDetalle: CompraDetalle = {
        nombre: this.newItem.nombre,
        precio: this.newItem.precio,
        fecha: now.toISOString(),
        compraId: this.compraId()!,
        isEditing: signal(false) // Cambiado a signal
      };

      await this.dbService.addCompraDetalle(newDetalle);
      this.toggleAddModal();
      await this.loadCompraDetails(this.compraId()!);
    } catch (error) {
      console.error('Error al añadir item:', error);
    }
  }

  async deleteItem(id: number): Promise<void> {
    if (!confirm('¿Estás seguro de eliminar este item?')) return;

    try {
      await this.dbService.deleteCompraDetalle(id);
      await this.loadCompraDetails(this.compraId()!);
    } catch (error) {
      console.error('Error al eliminar item:', error);
    }
  }

  private formatDate(dateString: string): string {
    const date = new Date(dateString);

    const day = date.getDate();
    const month = this.getMonthName(date.getMonth());
    const hours = date.getHours();
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
    const formattedHours = (hours % 12) || 12;

    return `${day} de ${month} - ${formattedHours}:${minutes} ${ampm}`;
  }

  private getMonthName(month: number): string {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];
    return months[month];
  }

  @ViewChild('inputItem', { static: false })
  set inputItem(element: ElementRef<HTMLInputElement>) {
    if (element) {
      element.nativeElement.focus()
    }
  }

  @ViewChild('inputPrice', { static: false })
  set inputPrice(element: ElementRef<HTMLInputElement>) {
    if (element) {
      element.nativeElement.focus()
    }
  }

  @ViewChild('inputTitle', { static: false })
  set inputTitle(element: ElementRef<HTMLInputElement>) {
    if (element) {
      element.nativeElement.focus()
    }
  }

  startEditingTitle(): void {
    this.editedListName.set(this.listName());
    this.isEditingTitle.set(true);
  }

  startEditingPrice(isEditing: WritableSignal<boolean>): void {
    this.editedListName.set(this.listName());
    isEditing.update(value => !value);
  }

  async savePrice(item: CompraDetalle): Promise<void> {
    item.precio = parseFloat(item.precio.toString());
    if (isNaN(item.precio) || item.precio < 0) {
      alert('El precio debe ser un número positivo.');
      return;
    }

    if (this.compraId()) {
      await this.dbService.updateCompraDetalle(item);
    }

    item.isEditing.set(false);
  }

  async saveTitle(): Promise<void> {
    const newName = this.editedListName().trim();
    if (newName && newName !== this.listName()) {
      this.listName.set(newName);
      if (this.compraId()) {
        await this.dbService.updateCompraTitle(this.compraId()!, newName);
      }
    }
    this.isEditingTitle.set(false);
  }

  cancelEditingTitle(): void {
    this.isEditingTitle.set(false);
  }

  cancelEditingPrice(item: CompraDetalle): void {
    item.isEditing.set(false);
  }

  onTitleInputKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.saveTitle();
    } else if (event.key === 'Escape') {
      this.cancelEditingTitle();
    }
  }

  onPriceInputKeydown(event: KeyboardEvent, item: CompraDetalle): void {
    if (event.key === 'Enter') {
      this.savePrice(item);
    } else if (event.key === 'Escape') {
      this.cancelEditingPrice(item);
    }
  }

}