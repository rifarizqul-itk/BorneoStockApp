import React, { useState } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator, Alert } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const router = useRouter();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>Izin kamera diperlukan.</Text>
        <Button onPress={requestPermission} title="Berikan Izin" />
      </View>
    );
  }

  const handleBarcodeScanned = async ({ data }: { data: string }) => {
    setScanned(true);
    setSearching(true);

    try {
      // Mencari apakah barcode sudah ada di Firestore
      const inventoryRef = collection(db, "inventory");
      const q = query(inventoryRef, where("barcode", "==", data));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        // Jika Ditemukan: Ambil ID dokumen pertama
        const foundItem = querySnapshot.docs[0];
        router.replace(`/item/${foundItem.id}` as any);
      } else {
        // Jika Tidak Ditemukan: Arahkan ke form tambah barang
        router.replace({
          pathname: "/add-item" as any,
          params: { barcode: data }
        });
      }
    } catch {
      Alert.alert("Error", "Gagal mengecek database.");
      setScanned(false);
    } finally {
      setSearching(false);
    }
  };

  return (
    <View style={styles.container}>
      <CameraView
        onBarcodeScanned={scanned ? undefined : handleBarcodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      
      {/* Overlay saat mencari di database */}
      {searching && (
        <View style={styles.overlay}>
          <ActivityIndicator size="large" color="#f7bd1a" />
          <Text style={styles.searchingText}>Mengecek Stok...</Text>
        </View>
      )}

      {/* Frame Penunjuk Scan */}
      <View style={styles.scanFrame} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  overlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.7)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  searchingText: { color: '#f7bd1a', marginTop: 10, fontWeight: 'bold' },
  scanFrame: {
    width: 250,
    height: 250,
    borderWidth: 2,
    borderColor: '#f7bd1a',
    backgroundColor: 'transparent',
    alignSelf: 'center',
    marginTop: '30%',
    borderRadius: 20
  }
});