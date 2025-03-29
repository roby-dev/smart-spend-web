// dashboard/dashboard.component.ts
import { CommonModule } from '@angular/common';
import { Component, OnInit, signal, inject, AfterContentInit, ViewChild, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DatabaseService } from '../../core/services/database.service';

interface FinancialList {
  id?: number;
  titulo: string;
  totalAmount: string;
  fecha: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements AfterContentInit {
  private router = inject(Router);
  private dbService = inject(DatabaseService);

  lists = signal<FinancialList[]>([]);
  isLoading = signal<boolean>(true);
  showAddModal = signal<boolean>(false);
  newList = { titulo: '' };

  @ViewChild('inputItem', { static: false })
  set inputItem(element: ElementRef<HTMLInputElement>) {
    if (element) {
      element.nativeElement.focus()
    }
  }
  
  ngAfterContentInit(): void {
    this.loadLists();
  }

  async loadLists(): Promise<void> {
    try {      
      this.isLoading.set(true);
      await this.dbService.initDatabase();
      
      const compras = await this.dbService.getComprasWithTotal();
      
      // Formatea la fecha para mostrar
      const formattedCompras = compras.map(compra => ({
        ...compra,
        fecha: this.formatDate(compra.fecha)
      }));
      
      this.lists.set(formattedCompras);
    } catch (error) {
      console.error('Error al cargar listas:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  navigateToDetail(id: number): void {
    this.router.navigate(['/main/list', id]);
  }

  toggleAddModal(): void {
    this.showAddModal.update(value => !value);
    if (!this.showAddModal()) {
      this.newList.titulo = '';
      
    }
  }

  async addNewList(): Promise<void> {
    if (!this.newList.titulo.trim()) return;
    
    try {
      const now = new Date();
      const newCompra = {
        titulo: this.newList.titulo,
        fecha: now.toISOString()
      };
      
      await this.dbService.addCompra(newCompra);
      this.toggleAddModal();
      await this.loadLists();
    } catch (error) {
      console.error('Error al añadir lista:', error);
    }
  }

  async deleteList(event: Event, id: number): Promise<void> {
    event.stopPropagation();
    if (!confirm('¿Estás seguro de que quieres eliminar esta lista?')) return;
    
    try {
      await this.dbService.deleteCompra(id);
      await this.loadLists();
    } catch (error) {
      console.error('Error al eliminar lista:', error);
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
}