import { Stack } from 'expo-router';
import { AuthProvider } from '../src/context/AuthContext';
import { CartProvider } from '../src/context/CartContext';
import { OutletProvider } from '../src/context/OutletContext';
import { StatusBar } from 'expo-status-bar';

export default function RootLayout() {
  return (
    <OutletProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
        </CartProvider>
      </AuthProvider>
    </OutletProvider>
  );
}
