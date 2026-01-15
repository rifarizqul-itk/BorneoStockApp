import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import SyncStatusBar from '@/components/SyncStatusBar';

export default function HomeScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [totalItems, setTotalItems] = useState(0);

  // Breakpoint layar lebar (Z Fold Main Screen)
  const isWideScreen = width > 600;

  useEffect(() => {
    const q = query(collection(db, "inventory"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      // Menghitung jumlah dokumen (jenis barang), bukan total seluruh stok fisik
      setTotalItems(snapshot.size);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Sync Status Bar */}
      <SyncStatusBar showAlways />
      
      {/* Container Penampung untuk Optimasi Layar Lebar */}
      <View style={[styles.contentWrapper, isWideScreen && styles.wideContent]}>
        
        {/* Header - Logo Kiri + Avatar Kanan */}
        <View style={styles.topHeader}>
          <Text style={styles.brandName}>BORNEO SPECIALIS PONSEL</Text>
          <View style={styles.avatarCircle}>
            <Ionicons name="person" size={24} color={Colors.text.onPrimary} />
          </View>
        </View>

        {/* Statistik Card - Full Background Kuning */}
        <View style={styles.statsContainer}>
          <View style={styles.heroCard}>
            <View>
              <Text style={styles.heroLabel}>Total Jenis Barang</Text>
              <Text style={styles.heroNumber}>{totalItems}</Text>
            </View>
            {/* Progress Bar */}
            <View style={styles.progressBar}>
              <View style={styles.progressFill} />
            </View>
          </View>
        </View>

        {/* Menu Grid - 2 Kolom */}
        <View style={styles.mainContent}>
          <View style={styles.menuGrid}>
            <TouchableOpacity 
              style={styles.menuCard} 
              onPress={() => router.push('/scan' as any)}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="barcode-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.menuTitle}>Scan Barcode</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard} 
              onPress={() => router.push('/inventory' as any)}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="cube-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.menuTitle}>Daftar Stok</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard} 
              onPress={() => router.push('/add-item' as any)}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="add-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.menuTitle}>Input Manual</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.menuCard} 
              onPress={() => router.push('/report' as any)}
            >
              <View style={styles.menuIconBox}>
                <Ionicons name="stats-chart-outline" size={32} color={Colors.primary} />
              </View>
              <Text style={styles.menuTitle}>Laporan</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background.main // #fafafa
  },
  contentWrapper: { flex: 1, paddingBottom: 50 },
  wideContent: { alignSelf: 'center', width: '95%', maxWidth: 1000 },
  
  // Header
  topHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.pagePadding,
    paddingTop: Spacing.pageTop,
    paddingBottom: Spacing.md,
  },
  brandName: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  // Statistik Card - Kuning Full
  statsContainer: { 
    paddingHorizontal: Spacing.pagePadding,
    marginTop: 10,
  },
  heroCard: {
    backgroundColor: Colors.primary, // #f7bd1a
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.card, // 24px
    ...Shadow.soft,
  },
  heroLabel: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.onPrimary,
    marginBottom: Spacing.xs,
  },
  heroNumber: {
    fontSize: FontSize.stockLarge,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 4,
    marginTop: Spacing.md,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#ffffff',
    borderRadius: 4,
    width: '60%',
  },
  
  // Menu Grid
  mainContent: { paddingHorizontal: Spacing.pagePadding, marginTop: Spacing.lg },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.cardGap,
  },
  menuCard: {
    width: '47%',
    backgroundColor: Colors.background.card,
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    ...Shadow.soft,
  },
  menuIconBox: {
    width: 60,
    height: 60,
    borderRadius: 16,
    backgroundColor: Colors.iconBox.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  menuTitle: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
    textAlign: 'center',
  },
});