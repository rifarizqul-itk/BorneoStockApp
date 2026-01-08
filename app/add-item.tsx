import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig'; // Pastikan path benar

export default function AddItemScreen() {
  const router = useRouter();
  const { barcode } = useLocalSearchParams(); // Menangkap barcode dari ScanScreen

  // State Form
  const [form, setForm] = useState({
    name: '',
    brand: '',
    model: '',
    category: '',
    quality: '',
    stock: '',
    price_buy: '',
    price_sell: '',
    location: '',
  });

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!form.name || !form.stock) {
      Alert.alert("Error", "Nama barang dan Stok minimal harus diisi!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "inventory"), {
        ...form,
        barcode: barcode || 'Manual Input',
        stock: Number(form.stock),
        price_buy: Number(form.price_buy),
        price_sell: Number(form.price_sell),
        created_at: serverTimestamp(),
      });
      
      Alert.alert("Sukses", "Barang berhasil disimpan!");
      router.replace('/(tabs)'); // Kembali ke Dashboard
    } catch (error) {
      console.error("Error adding document: ", error);
      Alert.alert("Error", "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, key: string, keyboardType: any = 'default') => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => setForm({ ...form, [key]: text })}
        placeholder={`Masukkan ${label}`}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.barcodeText}>📦 Barcode: {barcode || 'Tidak ada barcode'}</Text>
      </View>

      <View style={styles.formCard}>
        {renderInput("Nama Barang", form.name, 'name')}
        {renderInput("Brand (Contoh: Apple, Samsung)", form.brand, 'brand')}
        {renderInput("Seri Model (Contoh: iPhone 11)", form.model, 'model')}
        {renderInput("Kategori (LCD, Baterai, dll)", form.category, 'category')}
        {renderInput("Kualitas (Ori, Grade A, dll)", form.quality, 'quality')}
        {renderInput("Jumlah Stok", form.stock, 'stock', 'numeric')}
        {renderInput("Harga Modal", form.price_buy, 'price_buy', 'numeric')}
        {renderInput("Harga Jual", form.price_sell, 'price_sell', 'numeric')}
        {renderInput("Lokasi Rak", form.location, 'location')}

        <TouchableOpacity 
          style={[styles.saveButton, { opacity: loading ? 0.7 : 1 }]} 
          onPress={handleSave}
          disabled={loading}
        >
          <Text style={styles.saveButtonText}>
            {loading ? "Menyimpan..." : "SIMPAN BARANG"}
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  header: { padding: 20, backgroundColor: '#000000' },
  barcodeText: { color: '#f7bd1a', fontWeight: 'bold', fontSize: 16 },
  formCard: { padding: 20 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, fontWeight: 'bold', color: '#333', marginBottom: 5 },
  input: { 
    borderWidth: 1, 
    borderColor: '#ddd', 
    padding: 12, 
    borderRadius: 8, 
    fontSize: 16,
    backgroundColor: '#fafafa'
  },
  saveButton: { 
    backgroundColor: '#f7bd1a', 
    padding: 18, 
    borderRadius: 10, 
    alignItems: 'center', 
    marginTop: 20,
    borderWidth: 2,
    borderColor: '#000'
  },
  saveButtonText: { color: '#000', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});