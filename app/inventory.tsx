import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity } from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';

export default function InventoryScreen() {
  const router = useRouter();
  const [items, setItems] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);

  // 1. Ambil data secara Real-time dari Firebase
  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("created_at", "desc"));
    
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inventoryData: any[] = [];
      querySnapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() });
      });
      setItems(inventoryData);
      setFilteredItems(inventoryData);
    });

    return () => unsubscribe(); // Stop listening saat halaman ditutup
  }, []);

  // 2. Logika Pencarian
  useEffect(() => {
    const filtered = items.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity 
        style={styles.itemCard} 
        onPress={() => router.push(`/item/${item.id}` as any)} // Navigasi ke detail
    >
        <View style={styles.itemInfo}>
            <Text style={styles.itemName}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.brand} - {item.model}</Text>
            <View style={{flexDirection: 'row', gap: 5, marginTop: 5}}>
                <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.category || 'Sparepart'}</Text>
                </View>
                {item.location && (
                    <View style={[styles.badge, {backgroundColor: '#eee'}]}>
                        <Text style={[styles.badgeText, {color: '#666'}]}>{item.location}</Text>
                    </View>
                )}
            </View>
        </View>
        <View style={styles.stockContainer}>
        <Text style={styles.stockLabel}>STOK</Text>
        <Text style={styles.stockValue}>{item.stock}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
    </TouchableOpacity>
    );

  return (
    <View style={styles.container}>
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#888" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Cari barang atau tipe HP..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <Text style={styles.emptyText}>Barang tidak ditemukan atau stok kosong.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f4f4f4' },
  searchContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#fff', 
    margin: 15, 
    paddingHorizontal: 15, 
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd'
  },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16 },
  listContent: { paddingHorizontal: 15, paddingBottom: 20 },
  itemCard: { 
    backgroundColor: '#fff', 
    flexDirection: 'row', 
    padding: 15, 
    borderRadius: 12, 
    marginBottom: 10,
    alignItems: 'center',
    elevation: 2,
  },
  itemInfo: { flex: 1 },
  itemName: { fontSize: 16, fontWeight: 'bold', color: '#000' },
  itemSub: { fontSize: 13, color: '#666', marginTop: 2 },
  badge: { 
    backgroundColor: '#f7bd1a', 
    alignSelf: 'flex-start', 
    paddingHorizontal: 8, 
    paddingVertical: 2, 
    borderRadius: 5, 
    marginTop: 5 
  },
  badgeText: { fontSize: 10, fontWeight: 'bold', color: '#000' },
  stockContainer: { alignItems: 'center', minWidth: 50 },
  stockLabel: { fontSize: 10, fontWeight: 'bold', color: '#888' },
  stockValue: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  emptyText: { textAlign: 'center', marginTop: 50, color: '#888' }
});