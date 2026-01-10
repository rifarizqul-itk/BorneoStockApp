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

  const renderEditField = (label: string, value: string, key: string, keyboard: any = 'default') => (
    <View style={styles.editGroup}>
      <Text style={styles.editLabel}>{label}</Text>
      <TextInput
        style={styles.editInput}
        value={value?.toString()}
        editable={isEditing}
        keyboardType={keyboard}
        onChangeText={(text) => setItem({ ...item, [key]: text })}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header Elegan */}
      <View style={styles.topSection}>
        <View style={styles.headerInfo}>
            <View style={styles.badge}>
                <Text style={styles.badgeText}>{item.category || 'PRODUK'}</Text>
            </View>
            <Text style={styles.title}>{item.name}</Text>
            <Text style={styles.subtitle}>{item.brand} • {item.model}</Text>
        </View>
        <TouchableOpacity 
          style={[styles.editCircle, {backgroundColor: isEditing ? '#000' : '#f7bd1a'}]} 
          onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}
        >
          <Ionicons name={isEditing ? "checkmark" : "create-outline"} size={24} color={isEditing ? "#f7bd1a" : "#000"} />
        </TouchableOpacity>
      </View>

      {!isEditing ? (
        <View style={styles.content}>
          {/* Kartu Stok Gede */}
          <View style={styles.mainCard}>
            <View style={styles.stockInfo}>
                <Text style={styles.stockValue}>{item.stock}</Text>
                <Text style={styles.stockLabel}>UNIT TERSEDIA</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.locationInfo}>
                <Ionicons name="location" size={20} color="#f7bd1a" />
                <Text style={styles.locationText}>{item.location || 'Rak belum diatur'}</Text>
            </View>
          </View>

          {/* Kartu Harga */}
          <Text style={styles.sectionHeader}>Detail Harga</Text>
          <View style={styles.infoRow}>
            <View style={[styles.infoCard, {flex:1}]}>
                <Text style={styles.infoLabel}>Harga Modal</Text>
                <Text style={styles.infoValue}>Rp {(Number(item.price_buy) || 0).toLocaleString('id-ID')}</Text>
            </View>
            <View style={[styles.infoCard, {flex:1, borderLeftWidth: 4, borderLeftColor: '#f7bd1a'}]}>
                <Text style={styles.infoLabel}>Harga Jual</Text>
                <Text style={[styles.infoValue, {color: '#000'}]}>Rp {(Number(item.price_sell) || 0).toLocaleString('id-ID')}</Text>
            </View>
          </View>

          {/* Detail Tambahan */}
          <View style={styles.listCard}>
             <View style={styles.listItem}>
                <Text style={styles.listLabel}>Kualitas</Text>
                <Text style={styles.listValue}>{item.quality || '-'}</Text>
             </View>
             <View style={styles.listItem}>
                <Text style={styles.listLabel}>Barcode</Text>
                <Text style={styles.listValue}>{item.barcode || '-'}</Text>
             </View>
          </View>
        </View>
      ) : (
        <View style={styles.editForm}>
          {renderEditField("Nama Barang", item.name, 'name')}
          <View style={styles.row}>
            <View style={{flex:1}}>{renderEditField("Brand", item.brand, 'brand')}</View>
            <View style={{flex:1}}>{renderEditField("Model", item.model, 'model')}</View>
          </View>
          <View style={styles.row}>
            <View style={{flex:1}}>{renderEditField("Stok", item.stock, 'stock', 'numeric')}</View>
            <View style={{flex:1}}>{renderEditField("Lokasi", item.location, 'location')}</View>
          </View>
          <View style={styles.row}>
            <View style={{flex:1}}>{renderEditField("Harga Modal", item.price_buy, 'price_buy', 'numeric')}</View>
            <View style={{flex:1}}>{renderEditField("Harga Jual", item.price_sell, 'price_sell', 'numeric')}</View>
          </View>
          {renderEditField("Barcode", item.barcode, 'barcode')}
        </View>
      )}

      <TouchableOpacity 
        style={styles.deleteAction} 
        onPress={() => {
          Alert.alert("Hapus Barang", "Tindakan ini permanen. Lanjutkan?", [
            { text: "Batal", style: "cancel" },
            { text: "Hapus", style: "destructive", onPress: async () => {
              await deleteDoc(doc(db, "inventory", id as string));
              router.back();
            }}
          ]);
        }}
      >
        <Text style={styles.deleteText}>Hapus Barang dari Sistem</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  topSection: { 
    padding: 30, 
    paddingTop: 60, 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  headerInfo: { flex: 1 },
  badge: { backgroundColor: '#000', alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8, marginBottom: 12 },
  badgeText: { color: '#f7bd1a', fontSize: 10, fontWeight: 'bold' },
  title: { fontSize: 26, fontWeight: '900', color: '#000' },
  subtitle: { fontSize: 16, color: '#888', marginTop: 4 },
  editCircle: { width: 50, height: 50, borderRadius: 25, justifyContent: 'center', alignItems: 'center', elevation: 5 },
  content: { paddingHorizontal: 25 },
  mainCard: { 
    backgroundColor: '#fff', 
    padding: 25, 
    borderRadius: 30, 
    borderWidth: 1, 
    borderColor: '#f0f0f0', 
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 15,
  },
  stockInfo: { alignItems: 'center' },
  stockValue: { fontSize: 48, fontWeight: '900', color: '#000' },
  stockLabel: { fontSize: 12, fontWeight: 'bold', color: '#888', letterSpacing: 1 },
  divider: { height: 1, width: '100%', backgroundColor: '#f0f0f0', marginVertical: 20 },
  locationInfo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  locationText: { fontSize: 16, fontWeight: 'bold', color: '#444' },
  sectionHeader: { fontSize: 18, fontWeight: '900', color: '#000', marginTop: 30, marginBottom: 15 },
  infoRow: { flexDirection: 'row', gap: 15 },
  infoCard: { backgroundColor: '#f8f8f8', padding: 20, borderRadius: 20 },
  infoLabel: { fontSize: 10, fontWeight: 'bold', color: '#888', marginBottom: 5 },
  infoValue: { fontSize: 16, fontWeight: '900' },
  listCard: { backgroundColor: '#fff', marginTop: 20, borderRadius: 25, borderWidth: 1, borderColor: '#f0f0f0', padding: 10 },
  listItem: { flexDirection: 'row', justifyContent: 'space-between', padding: 15, borderBottomWidth: 1, borderBottomColor: '#f8f8f8' },
  listLabel: { color: '#888', fontWeight: 'bold' },
  listValue: { color: '#000', fontWeight: 'bold' },
  editForm: { padding: 25 },
  editGroup: { marginBottom: 20 },
  editLabel: { fontSize: 10, fontWeight: 'bold', color: '#ccc', marginBottom: 8, textTransform: 'uppercase' },
  editInput: { backgroundColor: '#f9f9f9', padding: 15, borderRadius: 15, fontSize: 16, fontWeight: 'bold', color: '#000' },
  row: { flexDirection: 'row', gap: 15 },
  deleteAction: { marginTop: 40, marginBottom: 50, alignItems: 'center' },
  deleteText: { color: '#ff4d4d', fontWeight: 'bold', textDecorationLine: 'underline' }
});