import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { collection, addDoc, serverTimestamp, query, getDocs, doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { Ionicons } from '@expo/vector-icons';
import { InventoryItem } from '@/types/inventory';
import { useOffline } from '@/contexts/OfflineContext';
import { addPendingChange, updateItemInCache } from '@/utils/storage';
import { generateChangeId } from '@/utils/offlineSync';

export default function AddItemScreen() {
  const router = useRouter();
  const { barcode: scannedBarcode } = useLocalSearchParams();
  const { isOnline, refreshPendingCount } = useOffline();

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
  const [focusedField, setFocusedField] = useState<string | null>(null);
  
  // Variant related states
  const [isVariant, setIsVariant] = useState(false);
  const [variantName, setVariantName] = useState('');
  const [parentItems, setParentItems] = useState<InventoryItem[]>([]);
  const [selectedParent, setSelectedParent] = useState<string | null>(null);
  const [showParentDropdown, setShowParentDropdown] = useState(false);

  useEffect(() => {
    // Fetch all potential parent items (non-variant items)
    const fetchParentItems = async () => {
      const q = query(collection(db, "inventory"));
      const snapshot = await getDocs(q);
      const items: InventoryItem[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data() as InventoryItem;
        // Only include items that are not variants themselves
        if (!data.parent_id) {
          items.push({ id: doc.id, ...data });
        }
      });
      setParentItems(items);
    };
    
    fetchParentItems();
  }, []);

  const handleSave = async () => {
    if (!form.name || !form.stock) {
      Alert.alert("Error", "Nama barang dan Stok wajib diisi!");
      return;
    }

    if (isVariant && !selectedParent) {
      Alert.alert("Error", "Pilih parent item untuk varian!");
      return;
    }

    if (isVariant && !variantName) {
      Alert.alert("Error", "Nama varian wajib diisi!");
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
      const itemData: any = {
        ...form,
        barcode: form.barcode || '-',
        stock: stockVal,
        price_buy: buyVal,
        price_sell: sellVal,
      };

      if (isVariant && selectedParent) {
        itemData.parent_id = selectedParent;
        itemData.variant_name = variantName;
        itemData.is_parent = false;
      } else {
        itemData.is_parent = false;
        itemData.variants = [];
      }

      if (isOnline) {
        // Online mode - save directly to Firestore
        if (isVariant && selectedParent) {
          // Add as a variant
          const variantRef = await addDoc(collection(db, "inventory"), {
            ...itemData,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
          
          // Update parent's variants array
          const parentRef = doc(db, "inventory", selectedParent);
          await updateDoc(parentRef, {
            variants: arrayUnion(variantRef.id),
            is_parent: true,
            updated_at: serverTimestamp(),
          });
        } else {
          // Add as standalone item
          await addDoc(collection(db, "inventory"), {
            ...itemData,
            created_at: serverTimestamp(),
            updated_at: serverTimestamp(),
          });
        }
        Alert.alert("Sukses", "Barang berhasil disimpan!");
      } else {
        // Offline mode - save to pending changes
        const tempId = `temp_${generateChangeId()}`;
        const itemDataWithId = {
          ...itemData,
          id: tempId,
          created_at: Date.now(),
          updated_at: Date.now(),
        };
        
        // Save to cache immediately
        await updateItemInCache(itemDataWithId);
        
        // Add to pending changes queue
        await addPendingChange({
          id: generateChangeId(),
          type: 'add',
          collection: 'inventory',
          data: itemDataWithId,
          timestamp: Date.now(),
        });
        
        // If variant, also queue parent update
        if (isVariant && selectedParent) {
          await addPendingChange({
            id: generateChangeId(),
            type: 'update',
            collection: 'inventory',
            data: {
              variants: arrayUnion(tempId),
              is_parent: true,
            },
            timestamp: Date.now(),
            itemId: selectedParent,
          });
        }
        
        await refreshPendingCount();
        Alert.alert(
          "Tersimpan Offline", 
          "Barang disimpan secara lokal. Akan disinkronkan saat online."
        );
      }
      
      router.replace('/(tabs)');
    } catch (error) {
      console.error("Error saving item:", error);
      Alert.alert("Error", "Gagal menyimpan data.");
    } finally {
      setLoading(false);
    }
  };

  const renderInput = (label: string, value: string, key: string, keyboardType: any = 'default', placeholder: string) => (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label} {key === 'name' || key === 'stock' ? '*' : ''}</Text>
      <TextInput
        style={[
          styles.input, 
          focusedField === key && styles.inputFocused
        ]}
        value={value}
        onChangeText={(text) => setForm({ ...form, [key]: text })}
        onFocus={() => setFocusedField(key)}
        onBlur={() => setFocusedField(null)}
        placeholder={placeholder}
        placeholderTextColor={Colors.text.secondary}
        keyboardType={keyboardType}
      />
    </View>
  );

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{flex:1}}>
        <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.formWrapper}>
            <Text style={styles.formHeader}>{scannedBarcode ? "Lengkapi Data" : "Input Manual"}</Text>
            
            {/* Variant Toggle */}
            <TouchableOpacity 
              style={styles.variantToggle}
              onPress={() => {
                setIsVariant(!isVariant);
                if (!isVariant) {
                  setShowParentDropdown(true);
                } else {
                  setSelectedParent(null);
                  setVariantName('');
                }
              }}
            >
              <View style={styles.variantToggleLeft}>
                <Ionicons 
                  name={isVariant ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={isVariant ? Colors.primary : Colors.text.secondary} 
                />
                <Text style={styles.variantToggleText}>
                  Ini adalah varian dari produk yang sudah ada
                </Text>
              </View>
            </TouchableOpacity>

            {/* Parent Selection - Show only if variant mode */}
            {isVariant && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Parent Item *</Text>
                <TouchableOpacity 
                  style={[styles.input, styles.dropdownButton]}
                  onPress={() => setShowParentDropdown(!showParentDropdown)}
                >
                  <Text style={[
                    styles.dropdownText,
                    !selectedParent && styles.dropdownPlaceholder
                  ]}>
                    {selectedParent 
                      ? parentItems.find(p => p.id === selectedParent)?.name 
                      : "Pilih parent item"}
                  </Text>
                  <Ionicons 
                    name={showParentDropdown ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={Colors.text.secondary} 
                  />
                </TouchableOpacity>
                
                {showParentDropdown && (
                  <ScrollView style={styles.dropdown} nestedScrollEnabled>
                    {parentItems.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        style={styles.dropdownItem}
                        onPress={() => {
                          setSelectedParent(item.id);
                          setShowParentDropdown(false);
                          // Auto-fill some fields from parent
                          setForm({
                            ...form,
                            brand: item.brand || '',
                            model: item.model || '',
                            category: item.category || '',
                          });
                        }}
                      >
                        <Text style={styles.dropdownItemText}>{item.name}</Text>
                        <Text style={styles.dropdownItemSubtext}>
                          {item.brand} • {item.model}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                )}
              </View>
            )}

            {/* Variant Name - Show only if variant mode */}
            {isVariant && (
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Nama Varian *</Text>
                <TextInput
                  style={[
                    styles.input,
                    focusedField === 'variant_name' && styles.inputFocused
                  ]}
                  value={variantName}
                  onChangeText={setVariantName}
                  onFocus={() => setFocusedField('variant_name')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Contoh: OLED Original, TFT Aftermarket"
                  placeholderTextColor={Colors.text.secondary}
                />
              </View>
            )}
            
            <View style={styles.inputGroup}>
                <Text style={styles.label}>Barcode / ID Barang</Text>
                <TextInput
                  style={[
                    styles.input, 
                    styles.barcodeInput,
                    focusedField === 'barcode' && styles.inputFocused
                  ]}
                  value={form.barcode}
                  onChangeText={(text) => setForm({ ...form, barcode: text })}
                  onFocus={() => setFocusedField('barcode')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="Scan atau ketik manual"
                  placeholderTextColor={Colors.text.secondary}
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
                  {loading ? "MENYIMPAN..." : "SIMPAN BARANG"}
              </Text>
            </TouchableOpacity>
        </View>
        </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: Colors.background.main // #fafafa
  },
  formWrapper: { padding: Spacing.pagePadding },
  formHeader: { 
    fontSize: FontSize.h1,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginBottom: 30 
  },
  inputGroup: { marginBottom: 20 },
  label: { 
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  input: { 
    backgroundColor: Colors.input.background, // #f9f9f9
    padding: 18,
    borderRadius: BorderRadius.input, // 16px
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    borderWidth: 2,
    borderColor: Colors.input.border, // #eeeeee
  },
  inputFocused: {
    borderColor: Colors.input.borderActive, // #f7bd1a
  },
  barcodeInput: { 
    borderLeftWidth: 5, 
    borderLeftColor: Colors.primary 
  },
  variantToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.iconBox.yellow,
    padding: 16,
    borderRadius: BorderRadius.input,
    marginBottom: 20,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  variantToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  variantToggleText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_500Medium',
    color: Colors.text.primary,
    flex: 1,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.primary,
    flex: 1,
  },
  dropdownPlaceholder: {
    color: Colors.text.secondary,
  },
  dropdown: {
    maxHeight: 200,
    backgroundColor: Colors.background.card,
    borderRadius: BorderRadius.input,
    borderWidth: 2,
    borderColor: Colors.input.border,
    marginTop: 8,
    ...Shadow.soft,
  },
  dropdownItem: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.input.border,
  },
  dropdownItemText: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  dropdownItemSubtext: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 2,
  },
  row: { flexDirection: 'row', gap: 15 },
  saveButton: { 
    backgroundColor: Colors.primary, // #f7bd1a
    height: 56,
    borderRadius: BorderRadius.button, // 16px
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: Spacing.lg,
    ...Shadow.button,
  },
  saveButtonText: { 
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary, // #000000
  },
});