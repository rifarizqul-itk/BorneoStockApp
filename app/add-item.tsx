import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebaseConfig';

export default function AddItemScreen() {
  const router = useRouter();
  const { barcode: scannedBarcode } = useLocalSearchParams();

  const [form, setForm] = useState({
    barcode: (scannedBarcode as string) || '',
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
      Alert.alert("Error", "Nama barang dan Stok wajib diisi!");
      return;
    }

    const stockVal = Number(form.stock);
    const buyVal = Number(form.price_buy) || 0;
    const sellVal = Number(form.price_sell) || 0;

    if (isNaN(stockVal)) {
      Alert.alert("Error", "Stok harus berupa angka!");
      return;
    }

    setLoading(true);
    try {
      await addDoc(collection(db, "inventory"), {
        ...form,
        barcode: form.barcode || '-',
        stock: stockVal,
        price_buy: buyVal,
        price_sell: sellVal,
        created_at: serverTimestamp(),
      });
      Alert.alert("Sukses", "Barang berhasil disimpan!");
      router.replace('/(tabs)');
    } catch {
      Alert.alert("Error", "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, key: string, keyboardType: any = 'default', placeholder: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} { key === 'name' || key === 'stock' ? '*' : ''}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={(text) => setForm({ ...form, [key]: text })}
        placeholder={placeholder}
        placeholderTextColor="#ccc"
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formWrapper}>
            <Text style={styles.formHeader}>{scannedBarcode ? "Lengkapi Data" : "Input Manual"}</Text>
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Barcode / ID Barang</Text>
                <TextInput
                style={[styles.input, styles.barcodeInput]}
                value={form.barcode}
                onChangeText={(text) => setForm({ ...form, barcode: text })}
                placeholder="Scan atau ketik manual"
                placeholderTextColor="#ccc"
                />
            </View>

            {renderInput("Nama Barang", form.name, 'name', 'default', "Contoh: LCD iPhone 11")}
            <View style={styles.row}>
                <View style={{flex:1}}>{renderInput("Brand", form.brand, 'brand', 'default', "Apple")}</View>
                <View style={{flex:1}}>{renderInput("Model", form.model, 'model', 'default', "iP 11")}</View>
            </View>
            <View style={styles.row}>
                <View style={{flex:1}}>{renderInput("Kategori", form.category, 'category', 'default', "Sparepart")}</View>
                <View style={{flex:1}}>{renderInput("Kualitas", form.quality, 'quality', 'default', "Ori")}</View>
            </View>
            
            {renderInput("Jumlah Stok", form.stock, 'stock', 'numeric', "0")}
            
            <View style={styles.row}>
                <View style={{flex:1}}>{renderInput("Harga Modal", form.price_buy, 'price_buy', 'numeric', "0")}</View>
                <View style={{flex:1}}>{renderInput("Harga Jual", form.price_sell, 'price_sell', 'numeric', "0")}</View>
            </View>
            
            {renderInput("Lokasi Rak", form.location, 'location', 'default', "A-1")}

            <TouchableOpacity 
            style={[styles.saveButton, { opacity: loading ? 0.7 : 1 }]} 
            onPress={handleSave}
            disabled={loading}
            >
            <Text style={styles.saveButtonText}>
                {loading ? "MENYIMPAN..." : "KONFIRMASI SIMPAN"}
            </Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  formWrapper: { padding: 25 },
  formHeader: { fontSize: 22, fontWeight: '900', color: '#000', marginBottom: 30 },
  inputGroup: { marginBottom: 20 },
  label: { fontSize: 12, fontWeight: 'bold', color: '#888', marginBottom: 8, textTransform: 'uppercase' },
  input: { 
    backgroundColor: '#f8f8f8',
    padding: 15, 
    borderRadius: 15, 
    fontSize: 16,
    color: '#000',
    borderWidth: 1,
    borderColor: '#eee'
  },
  barcodeInput: { borderLeftWidth: 5, borderLeftColor: '#f7bd1a' },
  row: { flexDirection: 'row', gap: 15 },
  saveButton: { 
    backgroundColor: '#000000', 
    padding: 20, 
    borderRadius: 20, 
    alignItems: 'center', 
    marginTop: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 5
  },
  saveButtonText: { color: '#f7bd1a', fontWeight: '900', fontSize: 16, letterSpacing: 1 },
});