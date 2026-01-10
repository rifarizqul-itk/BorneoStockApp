export interface InventoryItem {
  id?: string;
  name: string;
  brand: string;
  model: string;
  category: string;
  quality: string;
  stock: number;
  price_buy: number;
  price_sell: number;
  location: string;
  barcode: string;
  created_at?: any; // Firebase Timestamp
}
