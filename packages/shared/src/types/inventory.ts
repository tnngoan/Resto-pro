export enum StockMovementType {
  IN = 'IN',
  OUT = 'OUT',
  WASTE = 'WASTE',
  ADJUSTMENT = 'ADJUSTMENT',
}

export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  currentStock: number;
  minStock: number;
  costPerUnit: number; // VND integer
  supplierId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface StockMovement {
  id: string;
  ingredientId: string;
  type: StockMovementType;
  quantity: number;
  reason?: string;
  createdAt: string;
  createdBy?: string;
}
