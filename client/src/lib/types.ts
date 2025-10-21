export interface MultiLang {
  th: string;
  en: string;
}

export interface Category {
  id: number;
  name: MultiLang;
  description?: MultiLang;
  image_url?: string;
  sort_order: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Product {
  id: number;
  name: MultiLang;
  description?: MultiLang;
  price: number;
  sku?: string;
  image_url?: string;
  category_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface InventoryItem {
  id: number;
  product_id: number;
  stock_qty: number;
  unit: string;
  reorder_level: number;
  created_at: string;
  updated_at: string;
}

export interface Table {
  id: number;
  table_number: string;
  name?: MultiLang;
  capacity: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  order_number: string;
  table_id?: number;
  user_id?: number;
  status: 'pending' | 'confirmed' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  metadata?: any;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  name: MultiLang;
  qty: number;
  price: number;
  total: number;
  notes?: string;
  created_at: string;
}

export interface Payment {
  id: number;
  order_id: number;
  amount: number;
  method: 'cash' | 'card' | 'qr' | 'transfer';
  provider?: string;
  reference?: string;
  processed_at: string;
  created_at: string;
}

export interface CartItem {
  product: Product;
  qty: number;
  notes?: string;
}

