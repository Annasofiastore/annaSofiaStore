// ── ENUMS ─────────────────────────────────────────────────────

export type ProductStatus = "draft" | "active" | "archived";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "return_requested"
  | "return_in_transit"
  | "return_received"
  | "refunded";

export type DiscountType = "percentage" | "fixed";

// ── CATÁLOGO ──────────────────────────────────────────────────

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
}

export interface Collection {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  hero_url: string | null;
  sort_order: number;
  is_active: boolean;
  featured_on_home: boolean;
}

export interface Occasion {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
}

export interface VariantAttributes {
  talla?: string;
  color?: string;
  [key: string]: string | undefined;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  sku: string;
  price: number | null;
  stock: number;
  reserved: number;
  attributes: VariantAttributes;
  available_stock: number; // stock - reserved (calculado)
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  care_instructions: string | null;
  base_price: number;
  compare_price: number | null;
  status: ProductStatus;
  images: string[];
  created_at: string;
  updated_at: string;
  // Relaciones
  variants?: ProductVariant[];
  categories?: Category[];
  collections?: Collection[];
  occasions?: Occasion[];
  // Columnas reales
  is_best_seller?: boolean;
  is_pre_sale?: boolean;
  // Computados
  is_on_sale?: boolean;
  is_sold_out?: boolean;
  effective_price?: number;
}

// ── CARRITO ───────────────────────────────────────────────────

export interface CartItem {
  variantId: string;
  productId: string;
  productName: string;
  productSlug: string;
  image: string;
  sku: string;
  attributes: VariantAttributes;
  quantity: number;
  unitPrice: number;
  reservedUntil?: string; // ISO timestamp
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  shippingCost: number;
  total: number;
  appliedPromotion?: Promotion | null;
  sessionId: string;
}

// ── PEDIDOS ───────────────────────────────────────────────────

export interface OrderItem {
  id: string;
  order_id: string;
  variant_id: string;
  product_id: string;
  product_name: string;
  variant_sku: string;
  variant_attrs: VariantAttributes;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_number: string;
  customer_id: string | null;
  status: OrderStatus;
  shipping_name: string;
  shipping_email: string;
  shipping_phone: string;
  shipping_address: string;
  shipping_city: string;
  shipping_department: string;
  subtotal: number;
  discount_amount: number;
  shipping_cost: number;
  total: number;
  payment_method: string;
  wompi_transaction_id: string | null;
  wompi_reference: string | null;
  paid_at: string | null;
  tracking_number: string | null;
  courier: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
  items?: OrderItem[];
}

// ── CLIENTES ──────────────────────────────────────────────────

export interface Customer {
  id: string;
  auth_user_id: string | null;
  email: string;
  full_name: string;
  phone: string | null;
  marketing_email: boolean;
  marketing_whatsapp: boolean;
  is_guest: boolean;
  created_at: string;
}

export interface CustomerAddress {
  id: string;
  customer_id: string;
  label: string;
  full_name: string;
  phone: string;
  address: string;
  city: string;
  department: string;
  is_default: boolean;
}

// ── WISHLIST ──────────────────────────────────────────────────

export interface WishlistItem {
  id: string;
  customer_id: string;
  product_id: string;
  variant_id: string | null;
  added_at: string;
  product?: Product;
}

// ── PROMOCIONES ───────────────────────────────────────────────

export interface Promotion {
  id: string;
  code: string | null;
  name: string;
  discount_type: DiscountType;
  discount_value: number;
  scope: "global" | "product" | "collection";
  scope_id: string | null;
  max_uses: number | null;
  max_uses_per_customer: number;
  used_count: number;
  starts_at: string;
  ends_at: string;
  is_active: boolean;
  is_cumulative: boolean;
}

// ── CHECKOUT ──────────────────────────────────────────────────

export interface CheckoutForm {
  full_name: string;
  email: string;
  phone: string;
  id_type: string;
  id_number: string;
  address: string;
  city: string;
  department: string;
  coupon_code?: string;
  terms_accepted: boolean;
  save_address?: boolean;
}

// ── WOMPI ─────────────────────────────────────────────────────

export type WompiTransactionStatus =
  | "PENDING"
  | "APPROVED"
  | "DECLINED"
  | "VOIDED"
  | "ERROR";

export interface WompiWebhookEvent {
  event: string;
  data: {
    transaction: {
      id: string;
      reference: string;
      status: WompiTransactionStatus;
      amount_in_cents: number;
      currency: string;
    };
  };
  signature: {
    properties: string[];
    checksum: string;
  };
  timestamp: number;
  sent_at: string;
}

// ── HELPERS ───────────────────────────────────────────────────

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface ApiError {
  message: string;
  code?: string;
}
