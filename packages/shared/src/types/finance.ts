export enum TransactionCategory {
  FOOD_SALES = 'FOOD_SALES',
  BEVERAGE_SALES = 'BEVERAGE_SALES',
  OTHER_INCOME = 'OTHER_INCOME',
  INGREDIENT_PURCHASE = 'INGREDIENT_PURCHASE',
  UTILITIES = 'UTILITIES',
  STAFF_SALARIES = 'STAFF_SALARIES',
  EQUIPMENT = 'EQUIPMENT',
  MAINTENANCE = 'MAINTENANCE',
  MARKETING = 'MARKETING',
  OTHER_EXPENSE = 'OTHER_EXPENSE',
}

export interface Transaction {
  id: string;
  date: string;
  description: string;
  category: TransactionCategory;
  debitAmount: number; // VND integer
  creditAmount: number; // VND integer
  balance: number; // VND integer
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyRevenue {
  date: string;
  revenue: number; // VND integer
  covers: number; // Number of customers
  avgTicket: number; // VND integer
  orderCount: number;
}
