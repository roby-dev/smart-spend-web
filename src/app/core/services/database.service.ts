// services/database.service.ts
import { Injectable } from '@angular/core';
import { Compra } from '../models/compra';
import { CompraDetalle } from '../models/compra-detalle';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {
  private db!: IDBDatabase;
  private readonly DB_NAME = 'FinanzasPersonalesDB';
  private readonly DB_VERSION = 1;

  public initDatabase(): Promise<void> {
    return new Promise((resolve, reject) => {

      const request = indexedDB.open(this.DB_NAME, this.DB_VERSION);

      request.onerror = (event) => {
        console.error('Error al abrir la base de datos:', event);
        reject(new Error('No se pudo abrir la base de datos'));
      };

      request.onsuccess = (event) => {
        this.db = (event.target as IDBOpenDBRequest).result;
        console.log('Base de datos abierta correctamente');
        resolve();
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Crear almacén de compras si no existe
        if (!db.objectStoreNames.contains('compras')) {
          const comprasStore = db.createObjectStore('compras', { keyPath: 'id', autoIncrement: true });
          comprasStore.createIndex('titulo', 'titulo', { unique: false });
          comprasStore.createIndex('fecha', 'fecha', { unique: false });
        }

        // Crear almacén de detalles de compra si no existe
        if (!db.objectStoreNames.contains('compraDetalles')) {
          const detallesStore = db.createObjectStore('compraDetalles', { keyPath: 'id', autoIncrement: true });
          detallesStore.createIndex('compraId', 'compraId', { unique: false });
          detallesStore.createIndex('nombre', 'nombre', { unique: false });
          detallesStore.createIndex('fecha', 'fecha', { unique: false });
        }
      };
    });
  }

  // CRUD OPERATIONS FOR COMPRAS
  
  getAllCompras(): Promise<Compra[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compras'], 'readonly');
      const store = transaction.objectStore('compras');
      const request = store.getAll();

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject('Error al obtener las compras: ' + (event.target as IDBRequest).error);
      };
    });
  }

  getCompraById(id: number): Promise<Compra | undefined> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compras'], 'readonly');
      const store = transaction.objectStore('compras');
      const request = store.get(id);

      request.onsuccess = () => {
        resolve(request.result || undefined);
      };

      request.onerror = (event) => {
        reject('Error al obtener la compra: ' + (event.target as IDBRequest).error);
      };
    });
  }

  addCompra(compra: Compra): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compras'], 'readwrite');
      const store = transaction.objectStore('compras');
      const request = store.add(compra);

      request.onsuccess = (event) => {
        resolve(request.result as number);
      };

      request.onerror = (event) => {
        reject('Error al agregar la compra: ' + (event.target as IDBRequest).error);
      };
    });
  }

  updateCompra(compra: Compra): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compras'], 'readwrite');
      const store = transaction.objectStore('compras');
      const request = store.put(compra);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject('Error al actualizar la compra: ' + (event.target as IDBRequest).error);
      };
    });
  }

  deleteCompra(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      // Primero eliminamos los detalles asociados
      this.deleteDetallesByCompraId(id)
        .then(() => {
          // Luego eliminamos la compra
          const transaction = this.db.transaction(['compras'], 'readwrite');
          const store = transaction.objectStore('compras');
          const request = store.delete(id);

          request.onsuccess = () => {
            resolve();
          };

          request.onerror = (event) => {
            reject('Error al eliminar la compra: ' + (event.target as IDBRequest).error);
          };
        })
        .catch(reject);
    });
  }

  // CRUD OPERATIONS FOR COMPRA DETALLES

  getDetallesByCompraId(compraId: number): Promise<CompraDetalle[]> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compraDetalles'], 'readonly');
      const store = transaction.objectStore('compraDetalles');
      const index = store.index('compraId');
      const request = index.getAll(IDBKeyRange.only(compraId));

      request.onsuccess = () => {
        resolve(request.result);
      };

      request.onerror = (event) => {
        reject('Error al obtener los detalles: ' + (event.target as IDBRequest).error);
      };
    });
  }

  addCompraDetalle(detalle: CompraDetalle): Promise<number> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compraDetalles'], 'readwrite');
      const store = transaction.objectStore('compraDetalles');
      const { nombre ,precio, fecha , compraId} = detalle;
      const request = store.add({
        nombre,
        precio,
        fecha,
        compraId
      } as CompraDetalle);
      
      request.onsuccess = () => {
        resolve(request.result as number);
      };

      request.onerror = (event) => {
        reject('Error al agregar el detalle: ' + (event.target as IDBRequest).error);
      };
    });
  }

  updateCompraDetalle(detalle: CompraDetalle): Promise<void> {
    console.log(detalle);
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compraDetalles'], 'readwrite');
      const store = transaction.objectStore('compraDetalles');
      const { isEditing, ... detail } = detalle; // Desestructuramos para eliminar isEditing

      console.log(detail);
      const request = store.put(detail as CompraDetalle);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject('Error al actualizar el detalle: ' + (event.target as IDBRequest).error);
      };
    });
  }

  deleteCompraDetalle(id: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compraDetalles'], 'readwrite');
      const store = transaction.objectStore('compraDetalles');
      const request = store.delete(id);

      request.onsuccess = () => {
        resolve();
      };

      request.onerror = (event) => {
        reject('Error al eliminar el detalle: ' + (event.target as IDBRequest).error);
      };
    });
  }

  updateCompraTitle(id: number, newTitle: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compras'], 'readwrite');
      const store = transaction.objectStore('compras');
      const request = store.get(id);
  
      request.onsuccess = () => {
        const compra = request.result;
        if (compra) {
          compra.titulo = newTitle;
          const updateRequest = store.put(compra);
          updateRequest.onsuccess = () => resolve();
          updateRequest.onerror = (event) => reject('Error al actualizar el título de la compra: ' + (event.target as IDBRequest).error);
        } else {
          reject('Compra no encontrada');
        }
      };
  
      request.onerror = (event) => {
        reject('Error al obtener la compra: ' + (event.target as IDBRequest).error);
      };
    });
  }

  private deleteDetallesByCompraId(compraId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction(['compraDetalles'], 'readwrite');
      const store = transaction.objectStore('compraDetalles');
      const index = store.index('compraId');
      const request = index.openCursor(IDBKeyRange.only(compraId));

      request.onsuccess = (event) => {
        const cursor = (event.target as IDBRequest).result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
        } else {
          resolve();
        }
      };

      request.onerror = (event) => {
        reject('Error al eliminar los detalles: ' + (event.target as IDBRequest).error);
      };
    });
  }

  // Métodos auxiliares
  
  async getCompraTotal(compraId: number): Promise<number> {
    const detalles = await this.getDetallesByCompraId(compraId);
    return detalles.reduce((total, detalle) => total + detalle.precio, 0);
  }

  async getComprasWithTotal(): Promise<Array<Compra & { totalAmount: string }>> {
    const compras = await this.getAllCompras();
    
    const results = await Promise.all(compras.map(async (compra) => {
      const total = await this.getCompraTotal(compra.id!);
      return {
        ...compra,
        totalAmount: total.toFixed(2)
      };
    }));
    
    return results;
  }
}