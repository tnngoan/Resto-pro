export enum TableStatus {
  AVAILABLE = 'AVAILABLE',
  OCCUPIED = 'OCCUPIED',
  RESERVED = 'RESERVED',
  NEEDS_ATTENTION = 'NEEDS_ATTENTION',
  CLEANING = 'CLEANING',
}

export interface Table {
  id: string;
  name: string;
  capacity: number;
  status: TableStatus;
  zone?: string;
  positionX?: number;
  positionY?: number;
  currentOrderId?: string;
  currentCovers?: number;
  seatedAt?: string;
  createdAt: string;
  updatedAt: string;
}
