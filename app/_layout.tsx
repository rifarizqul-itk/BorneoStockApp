import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import 'react-native-reanimated';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useFonts, Poppins_400Regular, Poppins_500Medium, Poppins_600SemiBold, Poppins_700Bold } from '@expo-google-fonts/poppins';
import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { OfflineProvider } from '@/contexts/OfflineContext';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const colorScheme = useColorScheme();
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_500Medium,
    Poppins_600SemiBold,
    Poppins_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
  });

  useEffect(() => {
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <OfflineProvider>
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
          <Stack.Screen name="item/[id]" options={{ title: 'Detail Barang' }} />
          <Stack.Screen name="report" options={{ title: 'Laporan' }} />
          <Stack.Screen name="select-variant" options={{ title: 'Pilih Varian' }} />
        </Stack>
        <StatusBar style="auto" />
      </ThemeProvider>
    </OfflineProvider>
  );
}