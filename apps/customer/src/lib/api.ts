import axios, { AxiosInstance } from 'axios';

export interface MenuCategory {
  id: string;
  name: string;
  nameVi: string;
  order: number;
}

export interface MenuItemResponse {
  id: string;
  name: string; // Italian name
  nameVi: string; // Vietnamese name
  description: string;
  descriptionVi?: string;
  price: number; // in VND
  categoryId: string;
  image?: string;
  spicy?: number;
  allergens?: string[];
  tags?: string[];
}

export interface CreateOrderRequest {
  tableSlug: string;
  items: {
    menuItemId: string;
    quantity: number;
    notes?: string;
    modifications?: string;
  }[];
  customerName?: string;
  specialRequests?: string;
}

export interface OrderResponse {
  id: string;
  tableSlug: string;
  orderNumber: string;
  status: 'DRAFT' | 'PLACED' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'SERVED' | 'PAID' | 'COMPLETED' | 'CANCELLED';
  items: {
    menuItemId: string;
    name: string;
    quantity: number;
    price: number;
    status: 'PENDING' | 'PREPARING' | 'READY' | 'SERVED';
    notes?: string;
  }[];
  subtotal: number;
  vat: number;
  total: number;
  createdAt: string;
  updatedAt: string;
}

class RestoproAPI {
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api/v1';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Fetch all menu categories for a restaurant
   * TODO: Switch to real API endpoint once backend is ready
   */
  async fetchCategories(restaurantSlug: string): Promise<MenuCategory[]> {
    try {
      const response = await this.client.get<MenuCategory[]>(
        `/menu/${restaurantSlug}/categories`,
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Fetch menu items, optionally filtered by category
   * TODO: Switch to real API endpoint once backend is ready
   */
  async fetchMenuItems(
    restaurantSlug: string,
    categoryId?: string,
  ): Promise<MenuItemResponse[]> {
    try {
      const params = categoryId ? { categoryId } : undefined;
      const response = await this.client.get<MenuItemResponse[]>(
        `/menu/${restaurantSlug}/items`,
        { params },
      );
      return response.data;
    } catch (error) {
      console.error('Error fetching menu items:', error);
      throw error;
    }
  }

  /**
   * Fetch a single menu item by ID
   * TODO: Switch to real API endpoint once backend is ready
   */
  async fetchMenuItem(id: string): Promise<MenuItemResponse> {
    try {
      const response = await this.client.get<MenuItemResponse>(`/menu/items/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching menu item:', error);
      throw error;
    }
  }

  /**
   * Place an order
   * TODO: Switch to real API endpoint once backend is ready
   */
  async placeOrder(data: CreateOrderRequest): Promise<OrderResponse> {
    try {
      const response = await this.client.post<OrderResponse>('/orders', data);
      return response.data;
    } catch (error) {
      console.error('Error placing order:', error);
      throw error;
    }
  }

  /**
   * Get order status
   * TODO: Switch to real API endpoint once backend is ready
   */
  async getOrder(id: string): Promise<OrderResponse> {
    try {
      const response = await this.client.get<OrderResponse>(`/orders/${id}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching order:', error);
      throw error;
    }
  }
}

export const restoproAPI = new RestoproAPI();
