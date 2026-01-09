import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const fetchItem = useCallback(async () => {
    try {
      const docRef = doc(db, "inventory", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setItem(docSnap.data());
      }
    } catch {
      Alert.alert("Error", "Gagal mengambil detail.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { fetchItem(); }, [fetchItem]);

  const handleUpdate = async () => {
    if (!item.name || !item.stock) {
      Alert.alert("Error", "Nama barang dan Stok wajib diisi!");
      return;
    }

    try {
      const docRef = doc(db, "inventory", id as string);
      await updateDoc(docRef, {
        ...item,
        stock: Number(item.stock),
        price_buy: Number(item.price_buy) || 0,
        price_sell: Number(item.price_sell) || 0
      });
      Alert.alert("Sukses", "Data diperbarui!");
      setIsEditing(false);
      fetchItem();
    } catch {
      Alert.alert("Error", "Gagal memperbarui data.");
    }
  };

  if (loading) return <ActivityIndicator size="large" color="#f7bd1a" style={{marginTop: 50}} />;
  if (!item) return <View style={styles.container}><Text>Barang tidak ditemukan.</Text></View>;

  const renderField = (label: string, value: string, key: string, keyboard: any = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={[styles.input, !isEditing && styles.inputDisabled]}
        value={value?.toString()}
        editable={isEditing}
        keyboardType={keyboard}
        onChangeText={(text) => setItem({ ...item, [key]: text })}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.categoryBadge}>{item.category || 'Sparepart'}</Text>
          <TouchableOpacity 
            style={[styles.editButton, {backgroundColor: isEditing ? '#2e7d32' : '#f7bd1a'}]} 
            onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}
          >
            <Text style={styles.editButtonText}>{isEditing ? "SIMPAN" : "EDIT"}</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.brand} {item.model} - {item.quality}</Text>
      </View>

      {!isEditing ? (
        // Tampilan Mode Lihat (View Mode)
        <View style={styles.viewContainer}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Informasi Harga</Text>
            <View style={styles.priceRow}>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Harga Modal</Text>
                <Text style={styles.priceValue}>Rp {(Number(item.price_buy) || 0).toLocaleString('id-ID')}</Text>
              </View>
              <View style={styles.priceBox}>
                <Text style={styles.priceLabel}>Harga Jual</Text>
                <Text style={[styles.priceValue, {color: '#2e7d32'}]}>Rp {(Number(item.price_sell) || 0).toLocaleString('id-ID')}</Text>
              </View>
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Manajemen Stok</Text>
            <View style={styles.stockDisplay}>
              <Text style={styles.stockText}>{item.stock}</Text>
              <Text style={styles.stockSub}>Unit Tersedia</Text>
            </View>
            <Text style={styles.infoText}>Lokasi Rak: {item.location || '-'}</Text>
            <Text style={styles.infoText}>Barcode: {item.barcode || '-'}</Text>
          </View>
        </View>
      ) : (
        // Tampilan Mode Edit
        <View style={styles.formCard}>
          {renderField("Nama Barang *", item.name, 'name')}
          {renderField("Barcode / ID", item.barcode, 'barcode')}
          {renderField("Brand", item.brand, 'brand')}
          {renderField("Model", item.model, 'model')}
          {renderField("Kualitas", item.quality, 'quality')}
          {renderField("Kategori", item.category, 'category')}
          {renderField("Stok *", item.stock, 'stock', 'numeric')}
          {renderField("Harga Modal", item.price_buy, 'price_buy', 'numeric')}
          {renderField("Harga Jual", item.price_sell, 'price_sell', 'numeric')}
          {renderField("Lokasi Rak", item.location, 'location')}
        </View>
      )}

      <TouchableOpacity 
        style={styles.deleteButton} 
        onPress={() => {
          Alert.alert("Hapus", "Hapus barang ini?", [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", style: "destructive", onPress: async () => {
              await deleteDoc(doc(db, "inventory", id as string));
              router.back();
            }}
          ]);
        }}
      >
        <Ionicons name="trash-outline" size={20} color="red" />
        <Text style={{color: 'red', fontWeight: 'bold'}}>Hapus Barang</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { padding: 25, backgroundColor: '#000' },
  headerTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  categoryBadge: { backgroundColor: '#f7bd1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 5, fontSize: 12, fontWeight: 'bold' },
  editButton: { paddingHorizontal: 15, paddingVertical: 8, borderRadius: 5 },
  editButtonText: { fontWeight: 'bold', color: '#000' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#fff', marginTop: 15 },
  subtitle: { fontSize: 14, color: '#ccc', marginTop: 5 },
  viewContainer: { padding: 0 },
  section: { padding: 20, borderBottomWidth: 1, borderBottomColor: '#eee' },
  sectionTitle: { fontSize: 16, fontWeight: 'bold', marginBottom: 15, color: '#333' },
  priceRow: { flexDirection: 'row', justifyContent: 'space-between' },
  priceBox: { width: '48%' },
  priceLabel: { fontSize: 12, color: '#888' },
  priceValue: { fontSize: 18, fontWeight: 'bold', marginTop: 5 },
  stockDisplay: { backgroundColor: '#f9f9f9', padding: 20, borderRadius: 10, alignItems: 'center', marginBottom: 15 },
  stockText: { fontSize: 32, fontWeight: 'bold', color: '#000' },
  stockSub: { fontSize: 12, color: '#888' },
  infoText: { fontSize: 14, color: '#666', marginTop: 10 },
  formCard: { padding: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 10, borderRadius: 8, fontSize: 16, color: '#000' },
  inputDisabled: { backgroundColor: '#f9f9f9', color: '#666', borderColor: '#eee' },
  deleteButton: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', padding: 30, gap: 10, marginBottom: 20 },
});