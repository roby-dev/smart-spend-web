import { WritableSignal } from "@angular/core";

// models/compra-detalle.model.ts
export interface CompraDetalle {
    id?: number;
    nombre: string;
    precio: number;
    fecha: string;
    compraId: number;
    isEditing: WritableSignal<boolean>;
}