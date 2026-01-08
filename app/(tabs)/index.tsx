import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

export default function HomeScreen() {
  const router = useRouter();
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    // Listener real-time untuk menghitung statistik stok
    const q = query(collection(db, "inventory"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let lowStock = 0;
      
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += 1;
        // Ambang batas stok rendah (misal: < 5)
        if (Number(data.stock) < 5) {
          lowStock += 1;
        }
      });
      
      setTotalItems(total);
      setLowStockCount(lowStock);
    });

    return () => unsubscribe();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.headerContainer}>
        <Text style={styles.brandTitle}>BORNEO</Text>
        <Text style={styles.brandSubtitle}>Specialis Ponsel Dashboard</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.summaryRow}>
          <View style={[styles.card, styles.shadow]}>
            <Text style={styles.cardLabel}>TOTAL JENIS</Text>
            <Text style={styles.cardValue}>{totalItems}</Text>
          </View>
          <View style={[styles.card, styles.shadow, { borderLeftColor: lowStockCount > 0 ? '#FF3B30' : '#f7bd1a', borderLeftWidth: 5 }]}>
            <Text style={styles.cardLabel}>STOK MENIPIS</Text>
            <Text style={[styles.cardValue, { color: lowStockCount > 0 ? '#FF3B30' : '#000' }]}>{lowStockCount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Menu Utama</Text>
        
        <TouchableOpacity style={[styles.menuItem, styles.shadow]} onPress={() => router.push('/scan' as any)}>
          <View style={[styles.iconCircle, { backgroundColor: '#f7bd1a' }]}>
            <Ionicons name="barcode-outline" size={28} color="#000" />
          </View>
          <View>
            <Text style={styles.menuTitle}>Scan Barcode</Text>
            <Text style={styles.menuDesc}>Input atau cari barang via kamera</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.menuItem, styles.shadow]} onPress={() => router.push('/inventory' as any)}>
          <View style={[styles.iconCircle, { backgroundColor: '#000' }]}>
            <Ionicons name="cube-outline" size={28} color="#f7bd1a" />
          </View>
          <View>
            <Text style={styles.menuTitle}>Daftar Stok</Text>
            <Text style={styles.menuDesc}>Lihat dan edit manajemen barang</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },
  headerContainer: { backgroundColor: '#000', paddingTop: 60, paddingBottom: 40, paddingHorizontal: 25, borderBottomRightRadius: 50 },
  brandTitle: { fontSize: 32, fontWeight: '900', color: '#f7bd1a', letterSpacing: 2 },
  brandSubtitle: { fontSize: 16, color: '#fff', fontWeight: '500' },
  content: { paddingHorizontal: 20, marginTop: -30 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 25 },
  card: { backgroundColor: '#fff', width: '47%', padding: 15, borderRadius: 15 },
  shadow: { elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 5 },
  cardLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  cardValue: { fontSize: 24, fontWeight: 'bold', color: '#333' },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#333', marginBottom: 15 },
  menuItem: { backgroundColor: '#fff', flexDirection: 'row', alignItems: 'center', padding: 18, borderRadius: 20, marginBottom: 15 },
  iconCircle: { width: 55, height: 55, borderRadius: 27.5, justifyContent: 'center', alignItems: 'center', marginRight: 15 },
  menuTitle: { fontSize: 16, fontWeight: '700', color: '#333' },
  menuDesc: { fontSize: 12, color: '#888' }
});