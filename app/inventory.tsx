import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { InventoryItem } from '../types/inventory';

export default function InventoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions(); // Deteksi Lebar Layar
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Logika Kolom: 1 kolom di HP biasa/Cover Screen, 2 kolom di Main Screen Fold
  const numColumns = width > 700 ? 2 : 1;

  // Gunakan useMemo untuk filtering - menggantikan state filteredItems dan useEffect kedua
  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const query = searchQuery.toLowerCase();
    return items.filter(item => 
      item.name?.toLowerCase().includes(query) ||
      item.model?.toLowerCase().includes(query) ||
      item.brand?.toLowerCase().includes(query)
    );
  }, [items, searchQuery]);

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inventoryData: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(inventoryData);
    });
    return () => unsubscribe();
  }, []);

  const renderItem = useCallback(({ item }: { item: InventoryItem }) => (
    <TouchableOpacity 
        // Style dinamis untuk lebar kartu
        style={[styles.itemCard, { flex: 1/numColumns }]} 
        onPress={() => router.push(`/item/${item.id}` as any)}
    >
        <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.brand} • {item.model}</Text>
            <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category || 'Sparepart'}</Text>
                </View>
                {item.location && (
                    <View style={styles.locationBadge}>
                        <Ionicons name="location-outline" size={12} color="#888" />
                        <Text style={styles.locationText}>{item.location}</Text>
                    </View>
                )}
            </View>
        </View>
        <View style={styles.stockBox}>
            <Text style={styles.stockValue}>{item.stock}</Text>
            <Text style={styles.stockLabel}>Stok</Text>
        </View>
    </TouchableOpacity>
  ), [numColumns, router]);

  const columnWrapperStyle = useMemo(() => 
    numColumns > 1 ? { gap: 15 } : undefined
  , [numColumns]);

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color="#888" />
            <TextInput
            style={styles.searchInput}
            placeholder="Cari barang atau tipe HP..."
            placeholderTextColor="#888"
            value={searchQuery}
            onChangeText={setSearchQuery}
            />
        </View>
      </View>

      <FlatList
        key={numColumns} // Kunci untuk mereset layout saat lipatan berubah
        numColumns={numColumns}
        columnWrapperStyle={columnWrapperStyle}
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Barang tidak ditemukan.</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#ffffff' },
  searchWrapper: { padding: 20, backgroundColor: '#ffffff' },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#f8f8f8', 
    paddingHorizontal: 15, 
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#eee'
  },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 15, marginLeft: 10, color: '#000' },
  listContent: { paddingHorizontal: 20, paddingBottom: 20 },
  itemCard: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    padding: 18, 
    borderRadius: 20, 
    marginBottom: 15,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  itemSub: { fontSize: 13, color: '#888', marginTop: 2 },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  categoryBadge: { backgroundColor: '#f7bd1a', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-start' },
  categoryText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  locationBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f0f0f0', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, gap: 4 },
  locationText: { fontSize: 10, color: '#888', fontWeight: '500' },
  stockBox: { alignItems: 'center', backgroundColor: '#fafafa', padding: 10, borderRadius: 12, minWidth: 55 },
  stockValue: { fontSize: 18, fontWeight: '900', color: '#000' },
  stockLabel: { fontSize: 10, color: '#888', fontWeight: 'bold' },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { color: '#ccc', fontSize: 16 },
});