import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';

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

  if (loading) return <ActivityIndicator size="large" color={Colors.primary} style={{marginTop: 50}} />;
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ alignSelf: 'center', width: '100%', maxWidth: 800 }}
      showsVerticalScrollIndicator={false}
    >
      {/* FAB Edit Button */}
      <TouchableOpacity 
        style={styles.editFab} 
        onPress={() => isEditing ? handleUpdate() : setIsEditing(true)}
      >
        <Ionicons 
          name={isEditing ? "checkmark" : "create-outline"} 
          size={24} 
          color={Colors.primary} 
        />
      </TouchableOpacity>

      {/* Header */}
      <View style={styles.topSection}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.brand} • {item.model}</Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{item.category || 'PRODUK'}</Text>
        </View>
      </View>

      {!isEditing ? (
        <View style={styles.content}>
          {/* Kartu Stok - Background Kuning */}
          <View style={styles.mainCard}>
            <Text style={styles.stockValue}>{item.stock}</Text>
            <Text style={styles.stockLabel}>UNIT TERSEDIA</Text>
          </View>

          {/* Harga Card */}
          <Text style={styles.sectionHeader}>Detail Harga</Text>
          <View style={styles.infoRow}>
            <View style={[styles.infoCard, {flex:1}]}>
                <Text style={styles.infoLabel}>Harga Modal</Text>
                <Text style={styles.infoValue}>Rp {(Number(item.price_buy) || 0).toLocaleString('id-ID')}</Text>
            </View>
            <View style={[styles.infoCard, {flex:1, borderLeftWidth: 4, borderLeftColor: Colors.primary}]}>
                <Text style={styles.infoLabel}>Harga Jual</Text>
                <Text style={[styles.infoValue, {color: Colors.text.primary}]}>Rp {(Number(item.price_sell) || 0).toLocaleString('id-ID')}</Text>
            </View>
          </View>

          {/* Detail Tambahan */}
          <View style={styles.listCard}>
             <View style={styles.listItem}>
                <Text style={styles.listLabel}>Kualitas</Text>
                <Text style={styles.listValue}>{item.quality || '-'}</Text>
             </View>
             <View style={styles.listItem}>
                <Text style={styles.listLabel}>Lokasi Rak</Text>
                <Text style={styles.listValue}>{item.location || '-'}</Text>
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

      {/* Delete Button */}
      <TouchableOpacity 
        style={styles.deleteButton} 
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
  container: { 
    flex: 1, 
    backgroundColor: Colors.background.main // #fafafa
  },
  
  // FAB Edit Button
  editFab: {
    position: 'absolute',
    right: Spacing.pagePadding,
    top: Spacing.pageTop,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary, // #000000
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
    zIndex: 10,
  },
  
  // Header
  topSection: { 
    padding: Spacing.pagePadding + 10,
    paddingTop: Spacing.pageTop,
  },
  title: { 
    fontSize: 26,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  subtitle: { 
    fontSize: FontSize.h3,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 4 
  },
  badge: { 
    backgroundColor: Colors.badge.category.bg,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.badge,
    marginTop: 12 
  },
  badgeText: { 
    color: Colors.badge.category.text,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  
  content: { paddingHorizontal: Spacing.pagePadding },
  
  // Main Card - Kuning
  mainCard: {
    backgroundColor: Colors.primary, // Kuning
    padding: Spacing.cardPadding + 10,
    borderRadius: BorderRadius.card,
    alignItems: 'center',
    ...Shadow.soft,
  },
  stockValue: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary,
  },
  stockLabel: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.onPrimary,
    opacity: 0.8,
  },
  
  // Section
  sectionHeader: { 
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginTop: 30,
    marginBottom: 15 
  },
  infoRow: { flexDirection: 'row', gap: 15 },
  infoCard: { 
    backgroundColor: Colors.background.card,
    padding: 20,
    borderRadius: BorderRadius.card,
    ...Shadow.soft,
  },
  infoLabel: { 
    fontSize: 10,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
    marginBottom: 5 
  },
  infoValue: { 
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_700Bold',
  },
  
  listCard: { 
    backgroundColor: Colors.background.card,
    marginTop: 20,
    borderRadius: BorderRadius.card,
    ...Shadow.soft,
  },
  listItem: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f8f8f8' 
  },
  listLabel: { 
    color: Colors.text.secondary,
    fontFamily: 'Inter_500Medium',
  },
  listValue: { 
    color: Colors.text.primary,
    fontFamily: 'Poppins_600SemiBold',
  },
  
  // Edit Form
  editForm: { padding: Spacing.pagePadding },
  editGroup: { marginBottom: 20 },
  editLabel: { 
    fontSize: FontSize.caption,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.secondary,
    marginBottom: 8,
  },
  editInput: { 
    backgroundColor: Colors.input.background,
    padding: 15,
    borderRadius: BorderRadius.input,
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  row: { flexDirection: 'row', gap: 15 },
  
  // Delete Button
  deleteButton: {
    backgroundColor: Colors.badge.stockOut.bg, // #ffebee
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: BorderRadius.button,
    marginTop: Spacing.xl,
    marginHorizontal: Spacing.pagePadding,
    marginBottom: 50,
  },
  deleteText: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.badge.stockOut.text, // #c62828
    textAlign: 'center',
  }
});