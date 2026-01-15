// TypeScript types for BorneoStockApp

export interface InventoryItem {
  id: string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  location?: string;
  stock?: number;
  price_buy?: number;
  price_sell?: number;
  barcode?: string;
  quality?: string;
  created_at?: any;
  updated_at?: any;
  
  // Variant fields
  parent_id?: string;        // ID of parent item if this is a variant
  variants?: string[];       // Array of variant IDs if this is a parent
  variant_name?: string;     // Name of the variant (e.g., "OLED Original", "TFT Aftermarket")
  is_parent?: boolean;       // Whether this item is a parent/standalone
}

export interface TransactionLog {
  id?: string;
  item_id: string;
  item_name: string;
  type: 'in' | 'out' | 'adjustment';
  quantity: number;
  reason: string;
  notes?: string;
  timestamp: any;
  user?: string;
  old_stock?: number;
  new_stock?: number;
}

export interface FilterState {
  categories: string[];
  locations: string[];
  stockRange: { min: number; max: number };
  priceRange: { min: number; max: number };
  qualities: string[];
  stockStatus: 'all' | 'available' | 'out' | 'low';
  sortBy: 'newest' | 'name-asc' | 'name-desc' | 'stock-low' | 'stock-high' | 'price-low' | 'price-high' | 'variants';
}

export interface PendingChange {
  id: string;
  type: 'add' | 'update' | 'delete';
  collection: string;
  data: any;
  timestamp: number;
  itemId?: string;
}
