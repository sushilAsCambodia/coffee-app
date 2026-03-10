import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE    = process.env.EXPO_PUBLIC_BACKEND_URL || 'http://127.0.0.1:8000';
const APP_API     = `${API_BASE}/app-api/v1`;
const TOKEN_KEY   = '@coffee_app_token';
const OUTLET_KEY  = '@coffee_app_outlet_id';
const LOCALE_KEY  = '@coffee_app_locale';

// ─── Token / outlet / locale storage ─────────────────────────────────────────
let _token: string | null = null;
let _outletId: string     = process.env.EXPO_PUBLIC_OUTLET_ID || '1';
let _locale: string       = 'en';
let _loaded               = false;

async function loadSession(): Promise<void> {
  if (_loaded) return;
  const [token, outlet, locale] = await Promise.all([
    AsyncStorage.getItem(TOKEN_KEY),
    AsyncStorage.getItem(OUTLET_KEY),
    AsyncStorage.getItem(LOCALE_KEY),
  ]);
  _token    = token;
  _outletId = outlet || _outletId;
  _locale   = locale || _locale;
  _loaded   = true;
}

export async function setToken(token: string | null): Promise<void> {
  _token = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else        await AsyncStorage.removeItem(TOKEN_KEY);
}

export async function setOutletId(id: string): Promise<void> {
  _outletId = id;
  await AsyncStorage.setItem(OUTLET_KEY, id);
}

export async function setLocale(locale: string): Promise<void> {
  _locale = locale;
  await AsyncStorage.setItem(LOCALE_KEY, locale);
}

// ─── Core request ─────────────────────────────────────────────────────────────
async function request(path: string, options: RequestInit = {}): Promise<any> {
  await loadSession();

  const headers: Record<string, string> = {
    'Content-Type':    'application/json',
    Accept:            'application/json',
    'X-Outlet-ID':     _outletId,
    'X-Locale':        _locale,
    ...(options.headers as Record<string, string>),
  };

  if (_token) {
    headers['Authorization'] = `Bearer ${_token}`;
  }

  const res = await fetch(`${APP_API}${path}`, {
    ...options,
    headers,
    credentials: 'omit',
  });

  if (!res.ok) {
    let body: any = {};
    try { body = await res.json(); } catch {}

    let message = body.message || '';
    if (body.errors) {
      const flat = Object.values(body.errors as Record<string, string[]>).flat();
      if (flat.length) message = flat.join(' ');
    }
    throw new Error(message || `HTTP ${res.status}`);
  }

  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) return res.json();
  return { success: true };
}

// Unwrap Laravel's standard { success, data, message } envelope
function unwrap<T>(res: any): T {
  if (res && typeof res === 'object' && 'data' in res) return res.data as T;
  return res as T;
}

// ─── Public API ───────────────────────────────────────────────────────────────
export const api = {

  // ── Auth ──────────────────────────────────────────────────────────────────
  register: async (
    name: string, email: string, password: string, outletId?: number
  ): Promise<{ user: AuthUser; token: string }> => {
    const res = await request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        outlet_id: outletId || parseInt(_outletId, 10),
        name,
        email,
        password,
        password_confirmation: password,
      }),
    });
    return unwrap<{ user: AuthUser; token: string }>(res);
  },

  login: async (
    email: string, password: string
  ): Promise<{ user: AuthUser; token: string }> => {
    const res = await request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    return unwrap<{ user: AuthUser; token: string }>(res);
  },

  logout: async (): Promise<void> => {
    try { await request('/auth/logout', { method: 'POST' }); } catch {}
  },

  getMe: async (): Promise<AuthUser> => {
    const res = await request('/auth/me');
    return unwrap<AuthUser>(res);
  },

  clearSession: async (): Promise<void> => {
    _token  = null;
    _loaded = false;
    await AsyncStorage.multiRemove([TOKEN_KEY]);
  },

  // ── Categories ────────────────────────────────────────────────────────────
  getCategories: async (): Promise<Category[]> => {
    const res = await request('/categories');
    return unwrap<Category[]>(res);
  },

  // ── Menus ─────────────────────────────────────────────────────────────────
  getMenusByCategory: async (categoryId: number): Promise<Menu[]> => {
    const res = await request(`/menus/${categoryId}`);
    return unwrap<Menu[]>(res);
  },

  // ── Orders ────────────────────────────────────────────────────────────────
  createOrder: async (data: CreateOrderPayload): Promise<Order> => {
    const res = await request('/orders', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return unwrap<Order>(res);
  },

  getOrders: async (): Promise<Order[]> => {
    const res = await request('/orders');
    return unwrap<Order[]>(res);
  },

  getOrder: async (id: number): Promise<Order> => {
    const res = await request(`/orders/${id}`);
    return unwrap<Order>(res);
  },

  // ── Driver ────────────────────────────────────────────────────────────────
  getAvailableOrders: async (): Promise<any[]> => {
    const res = await request('/driver/available-orders');
    return unwrap<any[]>(res);
  },

  getActiveDelivery: async (): Promise<any | null> => {
    try {
      const res = await request('/driver/active-delivery');
      return unwrap<any>(res);
    } catch {
      return null;
    }
  },

  acceptOrder: async (orderId: string): Promise<void> => {
    await request(`/driver/orders/${orderId}/accept`, { method: 'POST' });
  },

  updateDriverLocation: async (lat: number, lng: number): Promise<void> => {
    await request('/driver/location', {
      method: 'POST',
      body: JSON.stringify({ lat, lng }),
    });
  },

  completeDelivery: async (orderId: string): Promise<void> => {
    await request(`/driver/orders/${orderId}/complete`, { method: 'POST' });
  },

  getDriverHistory: async (): Promise<any[]> => {
    const res = await request('/driver/history');
    return unwrap<any[]>(res);
  },

  // ── Admin: Drivers ─────────────────────────────────────────────────────────
  getDrivers: async (): Promise<any[]> => {
    const res = await request('/admin/drivers');
    return unwrap<any[]>(res);
  },

  createDriver: async (data: any): Promise<any> => {
    const res = await request('/admin/drivers', { method: 'POST', body: JSON.stringify(data) });
    return unwrap<any>(res);
  },

  deleteDriver: async (id: string): Promise<void> => {
    await request(`/admin/drivers/${id}`, { method: 'DELETE' });
  },

  // ── Admin: Dashboard & Orders ──────────────────────────────────────────────
  getAdminDashboard: async (): Promise<any> => {
    const res = await request('/admin/dashboard');
    return unwrap<any>(res);
  },

  getAdminOrders: async (status?: string): Promise<any[]> => {
    const path = status ? `/admin/orders?status=${status}` : '/admin/orders';
    const res = await request(path);
    return unwrap<any[]>(res);
  },

  updateOrderStatus: async (orderId: string, status: string): Promise<void> => {
    await request(`/admin/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  },

  // ── Admin: Products ────────────────────────────────────────────────────────
  getProducts: async (): Promise<any[]> => {
    const res = await request('/admin/products');
    return unwrap<any[]>(res);
  },

  createProduct: async (data: any): Promise<any> => {
    const res = await request('/admin/products', { method: 'POST', body: JSON.stringify(data) });
    return unwrap<any>(res);
  },

  updateProduct: async (id: string, data: any): Promise<any> => {
    const res = await request(`/admin/products/${id}`, { method: 'PUT', body: JSON.stringify(data) });
    return unwrap<any>(res);
  },

  deleteProduct: async (id: string): Promise<void> => {
    await request(`/admin/products/${id}`, { method: 'DELETE' });
  },

  // ── Locale ────────────────────────────────────────────────────────────────
  setLocale,
  setOutletId,
};

// ─── Types ────────────────────────────────────────────────────────────────────
export interface AuthUser {
  id: number;
  outlet_id: number;
  name: string;
  email: string;
  phone: string | null;
  // Driver / admin optional fields
  is_available?: boolean;
  vehicle?: string;
  plate?: string;
  role?: string;
  picture?: string | null;
}

export interface Category {
  id: number;
  name: string;
  sort_order: number;
  is_active: boolean;
}

export interface VariantOption {
  id: number;
  name: string;
  price: number;
}

export interface Variant {
  id: number;
  name: string;
  type: 'single' | 'multiple';
  options: VariantOption[];
}

export interface AddOn {
  id: number;
  name: string;
  price: number;
}

export interface Menu {
  id: number;
  sku: string;
  name: string;
  description: string;
  product_image: string;
  type: string;
  base_price: number;
  stock_quantity: number | null;
  low_stock_threshold: number | null;
  is_active: boolean;
  variants: Variant[];
  add_ons: AddOn[];
  has_active_promotion: boolean;
  discounted_price: number | null;
  active_promotion: {
    id: number;
    discount_type: 'percentage' | 'fixed';
    discount_value: number;
    start_date: string;
    end_date: string;
  } | null;
  // Injected client-side
  category_name?: string;
  category_id?: number;
}

export type OrderStatus  = 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
export type PaymentStatus = 'pending' | 'paid' | 'failed';

export interface OrderItem {
  menu_id: number;
  name: string;
  quantity: number;
  unit_price: number;
  product_image?: string;
  category?: string;
  description?: string;
  sku?: string;
  type?: string;
  variants?: any[];
  addons?: any[];
}

export interface CreateOrderPayload {
  items: OrderItem[];
  service_mode: 'takeaway' | 'dine_in';
  payment_method: string;
  customer_name?: string;
  customer_phone?: string;
  order_notes?: string;
}

export interface Order {
  id: number;
  order_number: string;
  daily_token: string;
  status: OrderStatus;
  service_mode: string;
  items: OrderItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  payment_method: string;
  payment_status: PaymentStatus;
  customer_name: string | null;
  customer_phone: string | null;
  order_notes: string | null;
  created_at: string;
  updated_at: string;
}

// Keep PaymentMethod for any component that still references it
export interface PaymentMethod {
  id: string;
  name: string;
  enabled: boolean;
}
