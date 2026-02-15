import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = process.env.EXPO_PUBLIC_BACKEND_URL || '';

async function getToken(): Promise<string | null> {
  return AsyncStorage.getItem('auth_token');
}

async function authHeaders(): Promise<Record<string, string>> {
  const token = await getToken();
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
}

async function request(path: string, options: RequestInit = {}): Promise<any> {
  const url = `${API_BASE}/api${path}`;
  const headers = await authHeaders();
  const res = await fetch(url, { ...options, headers: { ...headers, ...options.headers } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Request failed' }));
    throw new Error(err.detail || `HTTP ${res.status}`);
  }
  return res.json();
}

// Auth
export const api = {
  register: (data: { email: string; password: string; name: string; phone?: string }) =>
    request('/auth/register', { method: 'POST', body: JSON.stringify(data) }),

  login: (data: { email: string; password: string }) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify(data) }),

  getMe: () => request('/auth/me'),

  googleSession: (sessionId: string) =>
    request('/auth/google-session', { method: 'POST', body: JSON.stringify({ session_id: sessionId }) }),

  logout: () => request('/auth/logout', { method: 'POST' }),

  // Categories
  getCategories: () => request('/categories'),

  // Products
  getProducts: (params?: { category_id?: string; search?: string; popular?: boolean }) => {
    const q = new URLSearchParams();
    if (params?.category_id) q.set('category_id', params.category_id);
    if (params?.search) q.set('search', params.search);
    if (params?.popular) q.set('popular', 'true');
    const qs = q.toString();
    return request(`/products${qs ? `?${qs}` : ''}`);
  },

  getProduct: (id: string) => request(`/products/${id}`),

  // Cart
  getCart: () => request('/cart'),

  addToCart: (data: { product_id: string; quantity: number; size: string; sugar_level: string; add_ons: string[] }) =>
    request('/cart', { method: 'POST', body: JSON.stringify(data) }),

  updateCartItem: (cartId: string, quantity: number) =>
    request(`/cart/${cartId}`, { method: 'PUT', body: JSON.stringify({ quantity }) }),

  deleteCartItem: (cartId: string) =>
    request(`/cart/${cartId}`, { method: 'DELETE' }),

  clearCart: () => request('/cart', { method: 'DELETE' }),

  // Orders
  createOrder: (data: { delivery_address: string; payment_method?: string; note?: string }) =>
    request('/orders', { method: 'POST', body: JSON.stringify(data) }),

  getOrders: () => request('/orders'),

  getOrder: (id: string) => request(`/orders/${id}`),

  updateOrderStatus: (id: string, status: string) =>
    request(`/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) }),

  // Payment
  initiatePayment: (data: { order_id: string; method?: string }) =>
    request('/payment/initiate', { method: 'POST', body: JSON.stringify(data) }),

  confirmPayment: (paymentId: string) =>
    request(`/payment/confirm/${paymentId}`, { method: 'POST' }),

  // Tracking
  getTracking: (orderId: string) => request(`/tracking/${orderId}`),

  // Admin
  getAdminDashboard: () => request('/admin/dashboard'),
  getAdminOrders: () => request('/admin/orders'),
};
