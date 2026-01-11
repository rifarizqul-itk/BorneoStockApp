import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, useWindowDimensions } from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';

interface InventoryItem {
  id: string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  location?: string;
  stock?: number;
  created_at?: any;
}

export default function InventoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);

  // Logika Kolom: 1 kolom di HP biasa/Cover Screen, 2 kolom di Main Screen Fold
  const numColumns = width > 700 ? 2 : 1;

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inventoryData: InventoryItem[] = [];
      querySnapshot.forEach((doc) => {
        inventoryData.push({ id: doc.id, ...doc.data() } as InventoryItem);
      });
      setItems(inventoryData);
      setFilteredItems(inventoryData);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const filtered = items.filter(item => 
      item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.brand?.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredItems(filtered);
  }, [searchQuery, items]);

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity 
        style={[styles.itemCard, { flex: 1/numColumns }]} 
        onPress={() => router.push(`/item/${item.id}` as any)}
    >
        <View style={styles.itemIconBox}>
            <Ionicons name="cube" size={24} color={Colors.primary} />
        </View>
        <View style={styles.itemInfo}>
            <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
            <Text style={styles.itemSub}>{item.brand} • {item.model}</Text>
            <View style={styles.badgeRow}>
                <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category || 'Sparepart'}</Text>
                </View>
            </View>
        </View>
        <View style={styles.stockBox}>
            <Text style={styles.stockValue}>{item.stock}</Text>
            <Text style={styles.stockLabel}>Unit</Text>
        </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.searchWrapper}>
        <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari barang atau tipe HP..."
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
        </View>
      </View>

      <FlatList
        key={numColumns}
        numColumns={numColumns}
        columnWrapperStyle={numColumns > 1 ? { gap: 15 } : null}
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
  container: { 
    flex: 1, 
    backgroundColor: Colors.background.main // #fafafa
  },
  searchWrapper: { 
    padding: Spacing.md, 
    backgroundColor: Colors.background.main 
  },
  searchBar: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: Colors.background.card,
    paddingHorizontal: 15, 
    borderRadius: BorderRadius.input, // 16px
    borderWidth: 2,
    borderColor: Colors.input.border,
    ...Shadow.soft,
  },
  searchInput: { 
    flex: 1, 
    paddingVertical: 12, 
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    marginLeft: 10, 
    color: Colors.text.primary 
  },
  listContent: { paddingHorizontal: Spacing.md, paddingBottom: 20 },
  
  // Card Inventory
  itemCard: { 
    backgroundColor: Colors.background.card,
    flexDirection: 'row', 
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.card, // 24px
    marginBottom: Spacing.cardGap,
    alignItems: 'center',
    ...Shadow.soft,
  },
  itemIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.iconBox.yellow, // #fffbf0
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: { flex: 1, paddingRight: 10 },
  itemName: { 
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  itemSub: { 
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 2 
  },
  badgeRow: { flexDirection: 'row', gap: 8, marginTop: 8 },
  categoryBadge: { 
    backgroundColor: Colors.badge.category.bg, // #fff8e1
    paddingHorizontal: 10, 
    paddingVertical: 4, 
    borderRadius: BorderRadius.badge,
  },
  categoryText: { 
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.badge.category.text, // #d4a017
  },
  stockBox: { 
    alignItems: 'center', 
    backgroundColor: Colors.iconBox.yellow,
    padding: 12, 
    borderRadius: 16,
    minWidth: 60 
  },
  stockValue: { 
    fontSize: 22,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  stockLabel: { 
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.secondary,
  },
  emptyContainer: { marginTop: 100, alignItems: 'center' },
  emptyText: { 
    color: Colors.text.secondary,
    fontSize: FontSize.h3,
    fontFamily: 'Inter_400Regular',
  },
});