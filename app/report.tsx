import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, TouchableOpacity, TextInput, FlatList, Alert, Modal } from 'react-native';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { Paths, File } from 'expo-file-system';
import * as Sharing from 'expo-sharing';

interface InventoryItem {
  id: string;
  barcode?: string;
  name?: string;
  brand?: string;
  model?: string;
  category?: string;
  quality?: string;
  location?: string;
  stock?: number;
  price_buy?: number;
  price_sell?: number;
  created_at?: any;
}

type ReportMode = 'current' | 'added';
type DatePreset = 'today' | '7days' | 'month' | 'custom';

export default function ReportScreen() {
  const router = useRouter();
  const [mode, setMode] = useState<ReportMode>('current');
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [filteredItems, setFilteredItems] = useState<InventoryItem[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedLocation, setSelectedLocation] = useState<string>('');
  const [datePreset, setDatePreset] = useState<DatePreset>('today');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [showDateModal, setShowDateModal] = useState(false);
  
  // Unique values for dropdowns
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);

  // Fetch all inventory items
  useEffect(() => {
    const q = query(collection(db, "inventory"), orderBy("created_at", "desc"));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const inventoryData: InventoryItem[] = [];
      const categorySet = new Set<string>();
      const locationSet = new Set<string>();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        inventoryData.push({ ...data, id: doc.id } as InventoryItem);
        if (data.category) categorySet.add(data.category);
        if (data.location) locationSet.add(data.location);
      });
      
      setItems(inventoryData);
      setCategories(Array.from(categorySet).sort());
      setLocations(Array.from(locationSet).sort());
    });
    return () => unsubscribe();
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...items];

    // Mode-specific date filtering
    if (mode === 'added') {
      const start = new Date(startDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);

      filtered = filtered.filter(item => {
        if (!item.created_at) return false;
        const itemDate = item.created_at.toDate ? item.created_at.toDate() : new Date(item.created_at);
        return itemDate >= start && itemDate <= end;
      });
    }

    // Search filter
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.brand?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.model?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }

    // Location filter
    if (selectedLocation) {
      filtered = filtered.filter(item => item.location === selectedLocation);
    }

    setFilteredItems(filtered);
  }, [items, mode, searchQuery, selectedCategory, selectedLocation, startDate, endDate]);

  // Update date range when preset changes
  useEffect(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (datePreset) {
      case 'today':
        setStartDate(today);
        setEndDate(today);
        break;
      case '7days':
        const sevenDaysAgo = new Date(today);
        sevenDaysAgo.setDate(today.getDate() - 7);
        setStartDate(sevenDaysAgo);
        setEndDate(today);
        break;
      case 'month':
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
        setStartDate(monthStart);
        setEndDate(today);
        break;
    }
  }, [datePreset]);

  // Calculate KPIs
  const calculateKPIs = () => {
    const totalItemTypes = filteredItems.length;
    const totalUnits = filteredItems.reduce((sum, item) => sum + (item.stock || 0), 0);
    const totalBuyValue = filteredItems.reduce((sum, item) => 
      sum + ((item.stock || 0) * (item.price_buy || 0)), 0
    );
    const totalSellValue = filteredItems.reduce((sum, item) => 
      sum + ((item.stock || 0) * (item.price_sell || 0)), 0
    );
    
    return { totalItemTypes, totalUnits, totalBuyValue, totalSellValue };
  };

  const kpis = calculateKPIs();

  // Export to CSV
  const exportToCSV = async () => {
    try {
      const header = 'id,barcode,name,brand,model,category,quality,location,stock,price_buy,price_sell,created_at\n';
      const rows = filteredItems.map(item => {
        const createdAt = item.created_at 
          ? (item.created_at.toDate ? item.created_at.toDate().toISOString() : new Date(item.created_at).toISOString())
          : '';
        
        return [
          item.id,
          item.barcode || '',
          item.name || '',
          item.brand || '',
          item.model || '',
          item.category || '',
          item.quality || '',
          item.location || '',
          item.stock || 0,
          item.price_buy || 0,
          item.price_sell || 0,
          createdAt
        ].map(field => `"${field}"`).join(',');
      }).join('\n');

      const csv = header + rows;
      const fileName = `laporan_${mode}_${new Date().getTime()}.csv`;
      const file = new File(Paths.cache, fileName);

      await file.create();
      await file.write(csv);

      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(file.uri);
      } else {
        Alert.alert('Sukses', `File tersimpan di: ${file.uri}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Gagal mengekspor CSV');
      console.error(error);
    }
  };

  const renderItem = ({ item }: { item: InventoryItem }) => (
    <TouchableOpacity 
      style={styles.itemCard} 
      onPress={() => router.push(`/item/${item.id}` as any)}
    >
      <View style={styles.itemIconBox}>
        <Ionicons name="cube" size={24} color={Colors.primary} />
      </View>
      <View style={styles.itemInfo}>
        <Text style={styles.itemName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.itemSub}>{item.brand} • {item.model}</Text>
        <View style={styles.badgeRow}>
          {item.category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          )}
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
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Mode Selector */}
        <View style={styles.section}>
          <View style={styles.modeSelector}>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'current' && styles.modeButtonActive]}
              onPress={() => setMode('current')}
            >
              <Text style={[styles.modeText, mode === 'current' && styles.modeTextActive]}>
                Stok Saat Ini
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeButton, mode === 'added' && styles.modeButtonActive]}
              onPress={() => setMode('added')}
            >
              <Text style={[styles.modeText, mode === 'added' && styles.modeTextActive]}>
                Barang Ditambahkan
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Search */}
        <View style={styles.section}>
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={20} color={Colors.text.secondary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Cari nama, brand, model, barcode..."
              placeholderTextColor={Colors.text.secondary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Filters */}
        <View style={styles.section}>
          <View style={styles.filterRow}>
            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Kategori</Text>
              <View style={styles.pickerWrapper}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Pilih Kategori',
                      '',
                      [
                        { text: 'Semua', onPress: () => setSelectedCategory('') },
                        ...categories.map(cat => ({
                          text: cat,
                          onPress: () => setSelectedCategory(cat)
                        }))
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.pickerText}>
                    {selectedCategory || 'Semua'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.filterItem}>
              <Text style={styles.filterLabel}>Lokasi</Text>
              <View style={styles.pickerWrapper}>
                <TouchableOpacity
                  style={styles.pickerButton}
                  onPress={() => {
                    Alert.alert(
                      'Pilih Lokasi',
                      '',
                      [
                        { text: 'Semua', onPress: () => setSelectedLocation('') },
                        ...locations.map(loc => ({
                          text: loc,
                          onPress: () => setSelectedLocation(loc)
                        }))
                      ],
                      { cancelable: true }
                    );
                  }}
                >
                  <Text style={styles.pickerText}>
                    {selectedLocation || 'Semua'}
                  </Text>
                  <Ionicons name="chevron-down" size={16} color={Colors.text.secondary} />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Date Presets (for "Barang Ditambahkan" mode only) */}
        {mode === 'added' && (
          <View style={styles.section}>
            <Text style={styles.filterLabel}>Periode</Text>
            <View style={styles.datePresetRow}>
              <TouchableOpacity
                style={[styles.presetButton, datePreset === 'today' && styles.presetButtonActive]}
                onPress={() => setDatePreset('today')}
              >
                <Text style={[styles.presetText, datePreset === 'today' && styles.presetTextActive]}>
                  Hari ini
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetButton, datePreset === '7days' && styles.presetButtonActive]}
                onPress={() => setDatePreset('7days')}
              >
                <Text style={[styles.presetText, datePreset === '7days' && styles.presetTextActive]}>
                  7 Hari
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetButton, datePreset === 'month' && styles.presetButtonActive]}
                onPress={() => setDatePreset('month')}
              >
                <Text style={[styles.presetText, datePreset === 'month' && styles.presetTextActive]}>
                  Bulan ini
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.presetButton, datePreset === 'custom' && styles.presetButtonActive]}
                onPress={() => {
                  setDatePreset('custom');
                  setShowDateModal(true);
                }}
              >
                <Text style={[styles.presetText, datePreset === 'custom' && styles.presetTextActive]}>
                  Custom
                </Text>
              </TouchableOpacity>
            </View>
            {datePreset === 'custom' && (
              <View style={styles.customDateInfo}>
                <Text style={styles.dateRangeText}>
                  {startDate.toLocaleDateString('id-ID')} - {endDate.toLocaleDateString('id-ID')}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* KPI Cards */}
        <View style={styles.section}>
          <View style={styles.kpiGrid}>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.totalItemTypes}</Text>
              <Text style={styles.kpiLabel}>Jenis Barang</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>{kpis.totalUnits}</Text>
              <Text style={styles.kpiLabel}>Total Unit</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>Rp {kpis.totalBuyValue.toLocaleString('id-ID')}</Text>
              <Text style={styles.kpiLabel}>Nilai Modal</Text>
            </View>
            <View style={styles.kpiCard}>
              <Text style={styles.kpiValue}>Rp {kpis.totalSellValue.toLocaleString('id-ID')}</Text>
              <Text style={styles.kpiLabel}>Nilai Jual</Text>
            </View>
          </View>
        </View>

        {/* Export Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.exportButton} onPress={exportToCSV}>
            <Ionicons name="download-outline" size={20} color={Colors.text.onPrimary} />
            <Text style={styles.exportButtonText}>Export CSV</Text>
          </TouchableOpacity>
        </View>

        {/* Results List */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Hasil ({filteredItems.length} item)
          </Text>
          <FlatList
            data={filteredItems}
            keyExtractor={(item) => item.id}
            renderItem={renderItem}
            scrollEnabled={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Tidak ada data.</Text>
              </View>
            }
          />
        </View>
      </ScrollView>

      {/* Custom Date Modal */}
      <Modal
        visible={showDateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDateModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Pilih Rentang Tanggal</Text>
            
            <Text style={styles.modalLabel}>Tanggal Mulai</Text>
            <TextInput
              style={styles.dateInput}
              value={startDate.toLocaleDateString('id-ID')}
              editable={false}
            />
            
            <Text style={styles.modalLabel}>Tanggal Akhir</Text>
            <TextInput
              style={styles.dateInput}
              value={endDate.toLocaleDateString('id-ID')}
              editable={false}
            />
            
            <Text style={styles.dateNote}>
              Note: Custom date picker requires additional UI component. 
              Using preset dates for now.
            </Text>
            
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setShowDateModal(false)}
            >
              <Text style={styles.modalButtonText}>Tutup</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  section: {
    paddingHorizontal: Spacing.pagePadding,
    marginTop: Spacing.md,
  },
  
  // Mode Selector
  modeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.input,
    padding: 4,
    ...Shadow.soft,
  },
  modeButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: BorderRadius.input - 4,
  },
  modeButtonActive: {
    backgroundColor: Colors.primary,
  },
  modeText: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.secondary,
  },
  modeTextActive: {
    color: Colors.text.onPrimary,
  },
  
  // Search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    paddingHorizontal: 15,
    borderRadius: BorderRadius.input,
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
    color: Colors.text.primary,
  },
  
  // Filters
  filterRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  filterItem: {
    flex: 1,
  },
  filterLabel: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  pickerWrapper: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.input,
    borderWidth: 2,
    borderColor: Colors.input.border,
    ...Shadow.soft,
  },
  pickerButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
  },
  pickerText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
  },
  
  // Date Presets
  datePresetRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    flexWrap: 'wrap',
  },
  presetButton: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: BorderRadius.badge,
    backgroundColor: Colors.background.card,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  presetButtonActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  presetText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
  },
  presetTextActive: {
    color: Colors.text.onPrimary,
  },
  customDateInfo: {
    marginTop: Spacing.sm,
    padding: Spacing.sm,
    backgroundColor: Colors.iconBox.yellow,
    borderRadius: BorderRadius.badge,
  },
  dateRangeText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.primary,
  },
  
  // KPI Cards
  kpiGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  kpiCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: Colors.background.card,
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.card,
    ...Shadow.soft,
  },
  kpiValue: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.primary,
  },
  kpiLabel: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.secondary,
    marginTop: Spacing.xs,
  },
  
  // Export Button
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.secondary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    gap: Spacing.sm,
    ...Shadow.soft,
  },
  exportButtonText: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
  },
  
  // Results Section
  sectionTitle: {
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  
  // Item Card (reused from inventory)
  itemCard: {
    backgroundColor: Colors.background.card,
    flexDirection: 'row',
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.cardGap,
    alignItems: 'center',
    ...Shadow.soft,
  },
  itemIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.iconBox.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  itemInfo: {
    flex: 1,
    paddingRight: 10,
  },
  itemName: {
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  itemSub: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  categoryBadge: {
    backgroundColor: Colors.badge.category.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: BorderRadius.badge,
  },
  categoryText: {
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.badge.category.text,
  },
  stockBox: {
    alignItems: 'center',
    backgroundColor: Colors.iconBox.yellow,
    padding: 12,
    borderRadius: 16,
    minWidth: 60,
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
  emptyContainer: {
    marginTop: 50,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.text.secondary,
    fontSize: FontSize.h3,
    fontFamily: 'Inter_400Regular',
  },
  
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.card,
    padding: Spacing.cardPadding,
    width: '80%',
    maxWidth: 400,
  },
  modalTitle: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  modalLabel: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
    marginTop: Spacing.md,
    marginBottom: Spacing.sm,
  },
  dateInput: {
    backgroundColor: Colors.input.background,
    padding: 12,
    borderRadius: BorderRadius.input,
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  dateNote: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: Spacing.md,
    fontStyle: 'italic',
  },
  modalButton: {
    backgroundColor: Colors.primary,
    paddingVertical: 14,
    borderRadius: BorderRadius.button,
    marginTop: Spacing.lg,
    alignItems: 'center',
  },
  modalButtonText: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.onPrimary,
  },
});
