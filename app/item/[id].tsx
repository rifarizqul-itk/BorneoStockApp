import React, { useEffect, useState, useCallback} from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [newStock, setNewStock] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchItem = useCallback(async () => {
    try {
      const docRef = doc(db, "inventory", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        setItem(data);
        setNewStock(data.stock.toString());
      }
    } catch {
      Alert.alert("Error", "Gagal mengambil detail barang.");
    } finally {
      setLoading(false);
    }
  }, [id]);

    useEffect(() => {
    fetchItem();
  }, [fetchItem]);

  const handleUpdateStock = async () => {
    try {
      const docRef = doc(db, "inventory", id as string);
      await updateDoc(docRef, { stock: Number(newStock) });
      Alert.alert("Sukses", "Stok berhasil diperbarui!");
      fetchItem();
    } catch {
      Alert.alert("Error", "Gagal update stok.");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#f7bd1a" style={{marginTop: 50}} />;
  if (!item) return <Text>Barang tidak ditemukan.</Text>;

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.categoryBadge}>{item.category}</Text>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.brand} {item.model} - {item.quality}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Informasi Harga</Text>
        <View style={styles.priceRow}>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Harga Modal</Text>
            <Text style={styles.priceValue}>
                Rp {(Number(item.price_buy) || 0).toLocaleString('id-ID')}
            </Text>
          </View>
          <View style={styles.priceBox}>
            <Text style={styles.priceLabel}>Harga Jual</Text>
            <Text style={[styles.priceValue, {color: '#2e7d32'}]}>
                Rp {(Number(item.price_sell) || 0).toLocaleString('id-ID')}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📦 Manajemen Stok</Text>
        <View style={styles.stockEditContainer}>
          <TextInput 
            style={styles.stockInput}
            keyboardType="numeric"
            value={newStock}
            onChangeText={setNewStock}
          />
          <TouchableOpacity style={styles.updateButton} onPress={handleUpdateStock}>
            <Text style={styles.updateButtonText}>UPDATE STOK</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.infoText}>📍 Lokasi Rak: {item.location || '-'}</Text>
        <Text style={styles.infoText}>🆔 Barcode: {item.barcode}</Text>
      </View>

      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => {
          Alert.alert("Hapus", "Yakin ingin menghapus barang ini?", [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", style: "destructive", onPress: async () => {
              await deleteDoc(doc(db, "inventory", id as string));
              router.back();
            }}
          ]);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="red" />
        <Text style={styles.deleteText}>Hapus Barang dari Sistem</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 25, backgroundColor: '#000' },
  categoryBadge: { backgroundColor: '#f7bd1a', alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, fontSize: 12, fontWeight: 'bold', marginBottom: 10 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff' },
  subtitle: { fontSize: 16, color: '#ccc', marginTop: 5 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceBox: { width: '48%' },
  priceLabel: { fontSize: 12, color: '#888' },
  priceValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  stockEditContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 15 },
  stockInput: { borderWidth: 1, borderColor: '#ddd', padding: 12, borderRadius: 8, width: 80, fontSize: 18, textAlign: 'center', fontWeight: 'bold' },
  updateButton: { backgroundColor: '#f7bd1a', flex: 1, padding: 15, borderRadius: 8, alignItems: 'center' },
  updateButtonText: { fontWeight: 'bold', color: '#000' },
  infoText: { fontSize: 14, color: '#666', marginTop: 10 },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', padding: 30, gap: 10 },
  deleteText: { color: 'red', fontWeight: '500' }
});