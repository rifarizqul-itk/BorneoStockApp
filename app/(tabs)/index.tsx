import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

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
      {/* Container Penampung untuk Optimasi Layar Lebar */}
      <View style={[styles.contentWrapper, isWideScreen && styles.wideContent]}>
        
        {/* Header - Sesuai request (Tanpa lingkaran profil, teks lengkap) */}
        <View style={styles.topHeader}>
          <View>
            <Text style={styles.greeting}>Halo,</Text>
            <Text style={styles.brandName}>BORNEO SPECIALIS PONSEL</Text>
          </View>
        </View>

        {/* Statistik - Hanya Satu Kartu 'Hero' (Total Jenis) */}
        <View style={styles.statsContainer}>
          <View style={[styles.statCard, styles.heroCard]}>
            <View>
              <Text style={styles.statLabel}>TOTAL JENIS BARANG</Text>
              <Text style={styles.statNumber}>{totalItems}</Text>
            </View>
            {/* Ikon Dekorasi di kanan kartu */}
            <View style={styles.heroIcon}>
               <Ionicons name="cube" size={40} color="#f7bd1a" />
            </View>
          </View>
        </View>

        {/* Menu Utama - Grid System untuk Fold */}
        <View style={styles.mainContent}>
          
          <View style={isWideScreen ? styles.menuGrid : null}>
            <TouchableOpacity 
              style={[styles.actionCard, isWideScreen && styles.gridCard]} 
              onPress={() => router.push('/scan' as any)}
            >
              <View style={[styles.iconBox, {backgroundColor: '#000'}]}>
                <Ionicons name="barcode-outline" size={30} color="#f7bd1a" />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>Scan Barcode</Text>
                <Text style={styles.actionSub}>Cari atau input barang cepat</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, isWideScreen && styles.gridCard]} 
              onPress={() => router.push('/inventory' as any)}
            >
              <View style={[styles.iconBox, {backgroundColor: '#f7bd1a'}]}>
                <Ionicons name="cube-outline" size={30} color="#000" />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>Daftar Stok</Text>
                <Text style={styles.actionSub}>Kelola database sparepart</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.actionCard, isWideScreen && styles.gridCard]} 
              onPress={() => router.push('/add-item' as any)}
            >
              <View style={[styles.iconBox, {backgroundColor: '#eeeeee'}]}>
                <Ionicons name="add-outline" size={30} color="#000" />
              </View>
              <View style={styles.actionTextContent}>
                <Text style={styles.actionTitle}>Input Manual</Text>
                <Text style={styles.actionSub}>Tambah tanpa barcode</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          </View>

        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  // Tambahan Styles untuk Fold
  contentWrapper: { flex: 1, paddingBottom: 50 },
  wideContent: { alignSelf: 'center', width: '95%', maxWidth: 1000 }, 
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  gridCard: { width: '48%' }, 
  
  topHeader: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  greeting: { fontSize: 14, color: '#888', fontWeight: '500' },
  brandName: { fontSize: 20, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  
  statsContainer: { 
    paddingHorizontal: 20, 
    marginTop: 10 
  },
  statCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 25, 
    borderWidth: 1, 
    borderColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  heroCard: {
    width: '100%', // Full width karena cuma satu
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff', 
    borderLeftWidth: 6, // Aksen kuning di kiri
    borderLeftColor: '#f7bd1a'
  },
  statLabel: { fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 5, letterSpacing: 1 },
  statNumber: { fontSize: 36, fontWeight: '900', color: '#000' },
  heroIcon: { 
    opacity: 0.1, // Transparan agar estetik
    transform: [{ scale: 1.5 }] 
  },
  
  mainContent: { paddingHorizontal: 25, marginTop: 30 },
  sectionTitle: { fontSize: 18, fontWeight: '900', color: '#000', marginBottom: 20 },
  actionCard: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    alignItems: 'center', 
    padding: 15, 
    borderRadius: 20, 
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#f4f4f4',
  },
  iconBox: { 
    width: 60, 
    height: 60, 
    borderRadius: 15, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginRight: 15 
  },
  actionTextContent: { flex: 1 },
  actionTitle: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  actionSub: { fontSize: 12, color: '#888', marginTop: 2 },
});