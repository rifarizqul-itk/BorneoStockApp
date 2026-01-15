import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc, updateDoc, deleteDoc, collection, query, where, getDocs, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { InventoryItem, TransactionLog } from '@/types/inventory';
import QuickStockModal from '@/components/QuickStockModal';

export default function ItemDetail() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [item, setItem] = useState<InventoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState<'details' | 'history' | 'variants'>('details');
  
  // Variant states
  const [variants, setVariants] = useState<InventoryItem[]>([]);
  const [parentItem, setParentItem] = useState<InventoryItem | null>(null);
  
  // Transaction history
  const [transactions, setTransactions] = useState<TransactionLog[]>([]);
  
  // Quick stock modal
  const [quickStockModal, setQuickStockModal] = useState({
    visible: false,
    itemId: '',
    itemName: '',
    currentStock: 0,
  });

  const fetchItem = useCallback(async () => {
    try {
      const docRef = doc(db, "inventory", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const itemData = { id: docSnap.id, ...docSnap.data() } as InventoryItem;
        setItem(itemData);
        
        // Fetch variants if this is a parent item
        if (itemData.variants && itemData.variants.length > 0) {
          const variantPromises = itemData.variants.map(variantId => 
            getDoc(doc(db, "inventory", variantId))
          );
          const variantSnaps = await Promise.all(variantPromises);
          const variantData = variantSnaps
            .filter(snap => snap.exists())
            .map(snap => ({ id: snap.id, ...snap.data() } as InventoryItem));
          setVariants(variantData);
        }
        
        // Fetch parent item if this is a variant
        if (itemData.parent_id) {
          const parentSnap = await getDoc(doc(db, "inventory", itemData.parent_id));
          if (parentSnap.exists()) {
            setParentItem({ id: parentSnap.id, ...parentSnap.data() } as InventoryItem);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching item:", error);
      Alert.alert("Error", "Gagal mengambil detail.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { 
    fetchItem(); 
    
    // Subscribe to transaction history
    const transactionsQuery = query(
      collection(db, 'transactions'),
      where('item_id', '==', id),
      orderBy('timestamp', 'desc')
    );
    
    const unsubscribe = onSnapshot(transactionsQuery, (snapshot) => {
      const logs: TransactionLog[] = [];
      snapshot.forEach((doc) => {
        logs.push({ id: doc.id, ...doc.data() } as TransactionLog);
      });
      setTransactions(logs);
    });
    
    return () => unsubscribe();
  }, [fetchItem, id]);

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

      {/* FAB Quick Adjust Button */}
      {!isEditing && (
        <TouchableOpacity 
          style={styles.quickAdjustFab} 
          onPress={() => setQuickStockModal({
            visible: true,
            itemId: item.id,
            itemName: item.name || 'Item',
            currentStock: item.stock || 0,
          })}
        >
          <Ionicons name="flash" size={24} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* Header */}
      <View style={styles.topSection}>
        <Text style={styles.title}>{item.name}</Text>
        <Text style={styles.subtitle}>{item.brand} • {item.model}</Text>
        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{item.category || 'PRODUK'}</Text>
          </View>
          {item.variant_name && (
            <View style={styles.variantBadge}>
              <Text style={styles.variantBadgeText}>Varian: {item.variant_name}</Text>
            </View>
          )}
        </View>
        
        {/* Link to parent if this is a variant */}
        {parentItem && (
          <TouchableOpacity 
            style={styles.parentLink}
            onPress={() => router.push(`/item/${parentItem.id}` as any)}
          >
            <Ionicons name="arrow-up-circle-outline" size={16} color={Colors.primary} />
            <Text style={styles.parentLinkText}>
              Parent: {parentItem.name}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Tabs - Only show if not editing */}
      {!isEditing && (
        <View style={styles.tabBar}>
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'details' && styles.tabActive]}
            onPress={() => setActiveTab('details')}
          >
            <Text style={[styles.tabText, activeTab === 'details' && styles.tabTextActive]}>
              Detail
            </Text>
          </TouchableOpacity>
          
          {variants.length > 0 && (
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'variants' && styles.tabActive]}
              onPress={() => setActiveTab('variants')}
            >
              <Text style={[styles.tabText, activeTab === 'variants' && styles.tabTextActive]}>
                Varian ({variants.length})
              </Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity 
            style={[styles.tab, activeTab === 'history' && styles.tabActive]}
            onPress={() => setActiveTab('history')}
          >
            <Text style={[styles.tabText, activeTab === 'history' && styles.tabTextActive]}>
              Riwayat
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {!isEditing ? (
        <View style={styles.content}>
          {activeTab === 'details' && (
            <>
              {/* Kartu Stok - Background Kuning */}
              <View style={styles.mainCard}>
                <Text style={styles.stockValue}>{item.stock || 0}</Text>
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
            </>
          )}
          
          {activeTab === 'variants' && variants.length > 0 && (
            <>
              <Text style={styles.sectionHeader}>Varian Produk</Text>
              {variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={styles.variantCard}
                  onPress={() => router.push(`/item/${variant.id}` as any)}
                >
                  <View style={styles.variantInfo}>
                    <Text style={styles.variantName}>{variant.variant_name}</Text>
                    <Text style={styles.variantDetails}>
                      {variant.quality} • Rak {variant.location || '-'}
                    </Text>
                  </View>
                  <View style={styles.variantStock}>
                    <Text style={styles.variantStockValue}>{variant.stock || 0}</Text>
                    <Text style={styles.variantStockLabel}>unit</Text>
                  </View>
                </TouchableOpacity>
              ))}
              
              {/* Add Variant Button */}
              <TouchableOpacity
                style={styles.addVariantButton}
                onPress={() => router.push({
                  pathname: '/add-item' as any,
                  params: { parentId: item.id }
                })}
              >
                <Ionicons name="add-circle-outline" size={24} color={Colors.primary} />
                <Text style={styles.addVariantText}>Tambah Varian Baru</Text>
              </TouchableOpacity>
            </>
          )}
          
          {activeTab === 'history' && (
            <>
              <Text style={styles.sectionHeader}>Riwayat Stok</Text>
              {transactions.length === 0 ? (
                <View style={styles.emptyHistory}>
                  <Ionicons name="document-outline" size={48} color={Colors.text.secondary} />
                  <Text style={styles.emptyHistoryText}>Belum ada riwayat transaksi</Text>
                </View>
              ) : (
                transactions.map((transaction) => (
                  <View key={transaction.id} style={styles.transactionCard}>
                    <View style={styles.transactionHeader}>
                      <View style={[
                        styles.transactionIcon,
                        transaction.type === 'in' && styles.transactionIconIn,
                        transaction.type === 'out' && styles.transactionIconOut,
                      ]}>
                        <Ionicons 
                          name={transaction.type === 'in' ? 'arrow-down' : 'arrow-up'} 
                          size={20} 
                          color={Colors.background.card} 
                        />
                      </View>
                      <View style={styles.transactionInfo}>
                        <Text style={styles.transactionReason}>{transaction.reason}</Text>
                        <Text style={styles.transactionDate}>
                          {transaction.timestamp?.toDate?.()?.toLocaleDateString('id-ID') || '-'}
                        </Text>
                      </View>
                      <View style={styles.transactionAmount}>
                        <Text style={[
                          styles.transactionQuantity,
                          transaction.type === 'in' && styles.transactionQuantityIn,
                          transaction.type === 'out' && styles.transactionQuantityOut,
                        ]}>
                          {transaction.type === 'in' ? '+' : '-'}{transaction.quantity}
                        </Text>
                        {transaction.old_stock !== undefined && transaction.new_stock !== undefined && (
                          <Text style={styles.transactionStock}>
                            {transaction.old_stock} → {transaction.new_stock}
                          </Text>
                        )}
                      </View>
                    </View>
                    {transaction.notes && (
                      <Text style={styles.transactionNotes}>💬 {transaction.notes}</Text>
                    )}
                  </View>
                ))
              )}
            </>
          )}
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
      
      {/* Quick Stock Modal */}
      <QuickStockModal
        visible={quickStockModal.visible}
        onClose={() => setQuickStockModal({ ...quickStockModal, visible: false })}
        itemId={quickStockModal.itemId}
        itemName={quickStockModal.itemName}
        currentStock={quickStockModal.currentStock}
        onSuccess={() => {
          fetchItem();
        }}
      />
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
  
  // FAB Quick Adjust Button
  quickAdjustFab: {
    position: 'absolute',
    right: Spacing.pagePadding + 70,
    top: Spacing.pageTop,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
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
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 12,
  },
  badge: { 
    backgroundColor: Colors.badge.category.bg,
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.badge,
  },
  badgeText: { 
    color: Colors.badge.category.text,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  variantBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: BorderRadius.badge,
  },
  variantBadgeText: {
    color: Colors.text.onPrimary,
    fontSize: 11,
    fontFamily: 'Inter_600SemiBold',
  },
  parentLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  parentLinkText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.primary,
  },
  
  // Tabs
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.pagePadding,
    borderBottomWidth: 1,
    borderBottomColor: Colors.input.border,
    marginBottom: Spacing.lg,
  },
  tab: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginRight: 8,
  },
  tabActive: {
    borderBottomWidth: 3,
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.secondary,
  },
  tabTextActive: {
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
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
  
  // Variants
  variantCard: {
    backgroundColor: Colors.background.card,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    borderRadius: BorderRadius.input,
    marginBottom: Spacing.sm,
    borderWidth: 2,
    borderColor: Colors.input.border,
    ...Shadow.soft,
  },
  variantInfo: {
    flex: 1,
  },
  variantName: {
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  variantDetails: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  variantStock: {
    alignItems: 'center',
    backgroundColor: Colors.iconBox.yellow,
    padding: 12,
    borderRadius: 12,
    minWidth: 60,
  },
  variantStockValue: {
    fontSize: 20,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  variantStockLabel: {
    fontSize: 10,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.secondary,
  },
  addVariantButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.iconBox.yellow,
    padding: 16,
    borderRadius: BorderRadius.input,
    marginTop: Spacing.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    borderStyle: 'dashed',
  },
  addVariantText: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.primary,
  },
  
  // Transaction History
  emptyHistory: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyHistoryText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 12,
  },
  transactionCard: {
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.input,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.input.border,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  transactionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionIconIn: {
    backgroundColor: Colors.status.success,
  },
  transactionIconOut: {
    backgroundColor: Colors.status.error,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionReason: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  transactionDate: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  transactionQuantity: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
  },
  transactionQuantityIn: {
    color: Colors.status.success,
  },
  transactionQuantityOut: {
    color: Colors.status.error,
  },
  transactionStock: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  transactionNotes: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.input.border,
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