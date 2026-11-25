export interface Snack {
  id: string;
  name: string;
  category: string;
  description: string;
  price: number;
}

export interface SnackCartItem {
  snackId: string;
  quantity: number;
  price: number;
  name?: string;
}

export interface SnackOrder {
  orderId: string;
  orderDate: number;
  snacks: SnackCartItem[];
}

export const getTotal = (items: SnackCartItem[]): string =>
  items.reduce((total, item) => total + item.price * item.quantity, 0).toFixed(2);
