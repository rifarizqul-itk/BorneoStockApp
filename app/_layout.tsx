import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack screenOptions={{
        headerStyle: { backgroundColor: '#000' },
        headerTintColor: '#f7bd1a',
        headerTitleStyle: { fontWeight: 'bold' },
      }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="scan" options={{ title: 'Scan Barcode' }} />
        <Stack.Screen name="inventory" options={{ title: 'Daftar Stok' }} />
        <Stack.Screen name="add-item" options={{ title: 'Tambah Barang Baru' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}