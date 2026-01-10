import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../../firebaseConfig';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const router = useRouter();
  const [totalItems, setTotalItems] = useState(0);
  const [lowStockCount, setLowStockCount] = useState(0);

  useEffect(() => {
    const q = query(collection(db, "inventory"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let lowStock = 0;
      snapshot.forEach((doc) => {
        const data = doc.data();
        total += 1;
        if (Number(data.stock) < 5) lowStock += 1;
      });
      setTotalItems(total);
      setLowStockCount(lowStock);
    });
    return () => unsubscribe();
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Profil & Header - Sesuai gaya 'get.jpg' */}
      <View style={styles.topHeader}>
        <View>
          <Text style={styles.greeting}>Halo, Admin</Text>
          <Text style={styles.brandName}>BORNEO <Text style={{color: '#f7bd1a'}}>SP</Text></Text>
        </View>
        <TouchableOpacity style={styles.profileCircle}>
          <Ionicons name="person" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Ringkasan Statistik dalam Kartu Modern */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Total Jenis</Text>
          <Text style={styles.statNumber}>{totalItems}</Text>
          <View style={[styles.indicator, {backgroundColor: '#f7bd1a'}]} />
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statLabel}>Stok Menipis</Text>
          <Text style={[styles.statNumber, lowStockCount > 0 && {color: '#ff4d4d'}]}>{lowStockCount}</Text>
          <View style={[styles.indicator, {backgroundColor: lowStockCount > 0 ? '#ff4d4d' : '#28a745'}]} />
        </View>
      </View>

      <View style={styles.mainContent}>
        <Text style={styles.sectionTitle}>Layanan Utama</Text>
        
        {/* Tombol Aksi - Gaya Kartu Vertikal Modern */}
        <TouchableOpacity 
          style={styles.actionCard} 
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
          style={styles.actionCard} 
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
          style={styles.actionCard} 
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingHorizontal: 25, 
    paddingTop: 60, 
    paddingBottom: 20 
  },
  greeting: { fontSize: 14, color: '#888', fontWeight: '500' },
  brandName: { fontSize: 24, fontWeight: '900', color: '#000', letterSpacing: -0.5 },
  profileCircle: { 
    width: 45, 
    height: 45, 
    borderRadius: 25, 
    backgroundColor: '#f7bd1a', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  statsContainer: { 
    flexDirection: 'row', 
    paddingHorizontal: 20, 
    justifyContent: 'space-between', 
    marginTop: 10 
  },
  statCard: { 
    backgroundColor: '#fff', 
    width: '47%', 
    padding: 20, 
    borderRadius: 20, 
    borderWidth: 1, 
    borderColor: '#f0f0f0',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  statLabel: { fontSize: 12, color: '#888', fontWeight: 'bold', marginBottom: 5 },
  statNumber: { fontSize: 28, fontWeight: '900', color: '#000' },
  indicator: { height: 4, width: 30, borderRadius: 2, marginTop: 10 },
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