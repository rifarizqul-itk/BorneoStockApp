import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, TextInput, TouchableOpacity, useWindowDimensions, ScrollView } from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { InventoryItem, FilterState } from '@/types/inventory';
import QuickStockModal from '@/components/QuickStockModal';
import AdvancedFilterModal from '@/components/AdvancedFilterModal';
import SyncStatusBar from '@/components/SyncStatusBar';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { saveInventoryCache } from '@/utils/storage';
import { useOffline } from '@/contexts/OfflineContext';

export default function InventoryScreen() {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const { isOnline } = useOffline();
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  const [quickStockModal, setQuickStockModal] = useState<{
    visible: boolean;
    itemId: string;
    itemName: string;
    currentStock: number;
  }>({
    visible: false,
    itemId: '',
    itemName: '',
    currentStock: 0,
  });

  // Filter states
  const [showAdvancedFilter, setShowAdvancedFilter] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    categories: [],
    locations: [],
    stockRange: { min: 0, max: 99999 },
    priceRange: { min: 0, max: 99999999 },
    qualities: [],
    stockStatus: 'all',
    sortBy: 'newest',
  });
  const [quickFilters, setQuickFilters] = useState<string[]>([]);

  // Available filter options
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [availableQualities, setAvailableQualities] = useState<string[]>([]);

  // Logika Kolom: 1 kolom di HP biasa/Cover Screen, 2 kolom di Main Screen Fold
  const numColumns = width > 700 ? 2 : 1;

  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inventoryData: InventoryItem[] = [];
      const categories = new Set<string>();
      const locations = new Set<string>();
      const qualities = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data() as InventoryItem;
        inventoryData.push({ id: doc.id, ...data });
        
        // Collect unique values for filters
        if (data.category) categories.add(data.category);
        if (data.location) locations.add(data.location);
        if (data.quality) qualities.add(data.quality);
      });
      
      // Filter out variants - only show parent items and standalone items
      const parentItems = inventoryData.filter(item => !item.parent_id);
      
      setItems(parentItems);
      setFilteredItems(parentItems);
      setAvailableCategories(Array.from(categories).sort());
      setAvailableLocations(Array.from(locations).sort());
      setAvailableQualities(Array.from(qualities).sort());
      
      // Cache data when online
      if (isOnline) {
        saveInventoryCache(parentItems).catch(console.error);
      }
    });
    return () => unsubscribe();
  }, [isOnline]);

  // Load saved filters from AsyncStorage
  useEffect(() => {
    const loadFilters = async () => {
      try {
        const savedFilters = await AsyncStorage.getItem('inventory_filters');
        if (savedFilters) {
          setFilters(JSON.parse(savedFilters));
        }
      } catch (error) {
        console.error('Error loading filters:', error);
      }
    };
    loadFilters();
  }, []);

  // Apply filters and sorting
  useEffect(() => {
    let result = [...items];

    // Apply search query
    if (searchQuery) {
      result = result.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.categories.length > 0) {
      result = result.filter(item =>
        item.category && filters.categories.includes(item.category)
      );
    }

    // Apply location filter
    if (filters.locations.length > 0) {
      result = result.filter(item =>
        item.location && filters.locations.includes(item.location)
      );
    }

    // Apply quality filter
    if (filters.qualities.length > 0) {
      result = result.filter(item =>
        item.quality && filters.qualities.includes(item.quality)
      );
    }

    // Apply stock status filter
    if (filters.stockStatus !== 'all') {
      result = result.filter(item => {
        const stock = item.stock || 0;
        switch (filters.stockStatus) {
          case 'available':
            return stock > 0;
          case 'out':
            return stock === 0;
          case 'low':
            return stock > 0 && stock < 10;
          default:
            return true;
        }
      });
    }

    // Apply stock range filter
    result = result.filter(item => {
      const stock = item.stock || 0;
      return stock >= filters.stockRange.min && stock <= filters.stockRange.max;
    });

    // Apply price range filter
    result = result.filter(item => {
      const price = item.price_sell || 0;
      return price >= filters.priceRange.min && price <= filters.priceRange.max;
    });

    // Apply sorting
    switch (filters.sortBy) {
      case 'name-asc':
        result.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
        break;
      case 'name-desc':
        result.sort((a, b) => (b.name || '').localeCompare(a.name || ''));
        break;
      case 'stock-low':
        result.sort((a, b) => (a.stock || 0) - (b.stock || 0));
        break;
      case 'stock-high':
        result.sort((a, b) => (b.stock || 0) - (a.stock || 0));
        break;
      case 'price-low':
        result.sort((a, b) => (a.price_sell || 0) - (b.price_sell || 0));
        break;
      case 'price-high':
        result.sort((a, b) => (b.price_sell || 0) - (a.price_sell || 0));
        break;
      case 'variants':
        result.sort((a, b) => (b.variants?.length || 0) - (a.variants?.length || 0));
        break;
      case 'newest':
      default:
        // Already sorted by created_at desc from Firestore
        break;
    }

    setFilteredItems(result);
  }, [searchQuery, items, filters]);

  const handleApplyFilters = async (newFilters: FilterState) => {
    setFilters(newFilters);
    // Save to AsyncStorage
    try {
      await AsyncStorage.setItem('inventory_filters', JSON.stringify(newFilters));
    } catch (error) {
      console.error('Error saving filters:', error);
    }
  };

  const handleQuickFilter = (category: string) => {
    if (filters.categories.includes(category)) {
      // Remove category
      handleApplyFilters({
        ...filters,
        categories: filters.categories.filter(c => c !== category)
      });
    } else {
      // Add category
      handleApplyFilters({
        ...filters,
        categories: [...filters.categories, category]
      });
    }
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (filters.categories.length > 0) count += filters.categories.length;
    if (filters.locations.length > 0) count += filters.locations.length;
    if (filters.qualities.length > 0) count += filters.qualities.length;
    if (filters.stockStatus !== 'all') count += 1;
    if (filters.stockRange.min > 0 || filters.stockRange.max < 99999) count += 1;
    if (filters.priceRange.min > 0 || filters.priceRange.max < 99999999) count += 1;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  const SORT_OPTIONS = [
    { value: 'newest', label: 'Terbaru' },
    { value: 'name-asc', label: 'Nama A-Z' },
    { value: 'name-desc', label: 'Nama Z-A' },
    { value: 'stock-low', label: 'Stok Terendah' },
    { value: 'stock-high', label: 'Stok Tertinggi' },
    { value: 'price-low', label: 'Harga Terendah' },
    { value: 'price-high', label: 'Harga Tertinggi' },
    { value: 'variants', label: 'Paling Banyak Varian' },
  ];

  const renderItem = ({ item }: { item: InventoryItem }) => {
    const hasVariants = item.variants && item.variants.length > 0;
    const variantCount = hasVariants ? item.variants.length : 0;
    
    return (
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
                  {hasVariants && (
                    <View style={styles.variantBadge}>
                      <Text style={styles.variantText}>{variantCount} varian</Text>
                    </View>
                  )}
              </View>
          </View>
          <View style={styles.stockBox}>
              <Text style={styles.stockValue}>{item.stock || 0}</Text>
              <Text style={styles.stockLabel}>Unit</Text>
          </View>
          {/* Quick Adjust Button */}
          <TouchableOpacity
            style={styles.quickAdjustButton}
            onPress={(e) => {
              e.stopPropagation();
              setQuickStockModal({
                visible: true,
                itemId: item.id,
                itemName: item.name || 'Item',
                currentStock: item.stock || 0,
              });
            }}
          >
            <Ionicons name="flash" size={18} color={Colors.primary} />
          </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Sync Status Bar */}
      <SyncStatusBar />
      
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
        
        {/* Sort and Filter Row */}
        <View style={styles.filterRow}>
          {/* Sort Dropdown */}
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => {
              // Create a simple bottom sheet or modal for sort options
              const currentIndex = SORT_OPTIONS.findIndex(opt => opt.value === filters.sortBy);
              const nextIndex = (currentIndex + 1) % SORT_OPTIONS.length;
              handleApplyFilters({
                ...filters,
                sortBy: SORT_OPTIONS[nextIndex].value as any
              });
            }}
          >
            <Ionicons name="swap-vertical" size={18} color={Colors.text.primary} />
            <Text style={styles.sortButtonText}>
              {SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label || 'Sort'}
            </Text>
          </TouchableOpacity>
          
          {/* Advanced Filter Button */}
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowAdvancedFilter(true)}
          >
            <Ionicons name="options-outline" size={18} color={Colors.text.primary} />
            <Text style={styles.filterButtonText}>Filter</Text>
            {activeFilterCount > 0 && (
              <View style={styles.filterBadge}>
                <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Filter Chips */}
      {availableCategories.length > 0 && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.quickFiltersScroll}
          contentContainerStyle={styles.quickFilters}
        >
          <TouchableOpacity
            style={[
              styles.quickFilterChip,
              filters.categories.length === 0 && styles.quickFilterChipActive
            ]}
            onPress={() => handleApplyFilters({ ...filters, categories: [] })}
          >
            <Text style={[
              styles.quickFilterText,
              filters.categories.length === 0 && styles.quickFilterTextActive
            ]}>
              Semua
            </Text>
          </TouchableOpacity>
          
          {availableCategories.slice(0, 10).map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.quickFilterChip,
                filters.categories.includes(category) && styles.quickFilterChipActive
              ]}
              onPress={() => handleQuickFilter(category)}
            >
              <Text style={[
                styles.quickFilterText,
                filters.categories.includes(category) && styles.quickFilterTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

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
            <Ionicons name="cube-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>Barang tidak ditemukan.</Text>
            {activeFilterCount > 0 && (
              <TouchableOpacity
                style={styles.resetFiltersButton}
                onPress={() => handleApplyFilters({
                  categories: [],
                  locations: [],
                  stockRange: { min: 0, max: 99999 },
                  priceRange: { min: 0, max: 99999999 },
                  qualities: [],
                  stockStatus: 'all',
                  sortBy: 'newest',
                })}
              >
                <Text style={styles.resetFiltersText}>Reset Filter</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
      
      {/* Quick Stock Modal */}
      <QuickStockModal
        visible={quickStockModal.visible}
        onClose={() => setQuickStockModal({ ...quickStockModal, visible: false })}
        itemId={quickStockModal.itemId}
        itemName={quickStockModal.itemName}
        currentStock={quickStockModal.currentStock}
        onSuccess={() => {
          // Data will refresh automatically via onSnapshot
        }}
      />
      
      {/* Advanced Filter Modal */}
      <AdvancedFilterModal
        visible={showAdvancedFilter}
        onClose={() => setShowAdvancedFilter(false)}
        onApply={handleApplyFilters}
        currentFilters={filters}
        availableCategories={availableCategories}
        availableLocations={availableLocations}
        availableQualities={availableQualities}
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
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  sortButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.background.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.input,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  sortButtonText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.background.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: BorderRadius.input,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  filterButtonText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.primary,
  },
  filterBadge: {
    backgroundColor: Colors.primary,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary,
  },
  quickFiltersScroll: {
    maxHeight: 50,
  },
  quickFilters: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  quickFilterChip: {
    backgroundColor: Colors.input.background,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: BorderRadius.badge,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  quickFilterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  quickFilterText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
  },
  quickFilterTextActive: {
    color: Colors.text.onPrimary,
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
  variantBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.badge,
  },
  variantText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.onPrimary,
  },
  quickAdjustButton: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
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
    marginTop: 16,
  },
  resetFiltersButton: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: BorderRadius.button,
    marginTop: 16,
  },
  resetFiltersText: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.onPrimary,
  },
});