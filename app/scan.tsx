import React, { useState } from 'react';
import { Text, View, StyleSheet, Button, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Shadow } from '@/constants/theme';

export default function ScanScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [searching, setSearching] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);
  const router = useRouter();

  if (!permission) return <View />;
  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <Text style={styles.permissionText}>Izin kamera diperlukan untuk scan barcode</Text>
        <Button onPress={requestPermission} title="Berikan Izin" color={Colors.primary} />
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
        const itemData = foundItem.data();
        
        // Check if this is a parent item with variants
        if (itemData.variants && itemData.variants.length > 0) {
          // Redirect to variant selection
          router.replace({
            pathname: "/select-variant" as any,
            params: { parentId: foundItem.id }
          });
        } else {
          // Regular item or variant - go to detail page
          router.replace(`/item/${foundItem.id}` as any);
        }
      } else {
        // Jika Tidak Ditemukan: Arahkan ke form tambah barang
        router.replace({
          pathname: "/add-item" as any,
          params: { barcode: data }
        });
      }
    } catch (error) {
      console.error("Error scanning barcode:", error);
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
        enableTorch={flashEnabled}
      />
      
      {/* Overlay Hitam */}
      <View style={styles.overlay} />

      {/* Corner Frame Brackets */}
      <View style={styles.scanFrameContainer}>
        {/* Top Left Corner */}
        <View style={[styles.corner, styles.topLeft]} />
        {/* Top Right Corner */}
        <View style={[styles.corner, styles.topRight]} />
        {/* Bottom Left Corner */}
        <View style={[styles.corner, styles.bottomLeft]} />
        {/* Bottom Right Corner */}
        <View style={[styles.corner, styles.bottomRight]} />
      </View>

      {/* Instruksi */}
      <View style={styles.instructionContainer}>
        <Text style={styles.instructionText}>
          Arahkan kamera ke barcode
        </Text>
        
        {/* Flashlight Button */}
        <TouchableOpacity 
          style={styles.flashButton}
          onPress={() => setFlashEnabled(!flashEnabled)}
        >
          <Ionicons 
            name={flashEnabled ? "flash" : "flash-outline"} 
            size={28} 
            color={Colors.text.onPrimary} 
          />
        </TouchableOpacity>
      </View>
      
      {/* Overlay saat mencari di database */}
      {searching && (
        <View style={styles.searchingOverlay}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.searchingText}>Mengecek Stok...</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#000' 
  },
  permissionText: {
    color: '#fff',
    fontSize: FontSize.h3,
    fontFamily: 'Inter_400Regular',
    textAlign: 'center',
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.pagePadding,
  },
  
  // Overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  
  // Corner Frame Container
  scanFrameContainer: {
    position: 'absolute',
    width: 280,
    height: 280,
    alignSelf: 'center',
    top: '30%',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: Colors.primary, // #f7bd1a
    borderWidth: 4,
  },
  topLeft: {
    top: 0,
    left: 0,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderTopLeftRadius: 12,
  },
  topRight: {
    top: 0,
    right: 0,
    borderLeftWidth: 0,
    borderBottomWidth: 0,
    borderTopRightRadius: 12,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderRightWidth: 0,
    borderTopWidth: 0,
    borderBottomLeftRadius: 12,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderBottomRightRadius: 12,
  },
  
  // Instruction
  instructionContainer: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    alignItems: 'center',
  },
  instructionText: {
    color: '#ffffff',
    fontSize: FontSize.body,
    fontFamily: 'Inter_500Medium',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  flashButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.button,
  },
  
  // Searching Overlay
  searchingOverlay: { 
    ...StyleSheet.absoluteFillObject, 
    backgroundColor: 'rgba(0,0,0,0.8)', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  searchingText: { 
    color: Colors.primary,
    marginTop: 10,
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_600SemiBold',
  },
});