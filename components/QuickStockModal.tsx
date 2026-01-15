import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  Alert,
  ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { doc, updateDoc, collection, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import * as Haptics from 'expo-haptics';
import { useOffline } from '@/contexts/OfflineContext';
import { addPendingChange, updateItemInCache } from '@/utils/storage';
import { generateChangeId } from '@/utils/offlineSync';

interface QuickStockModalProps {
  visible: boolean;
  onClose: () => void;
  itemId: string;
  itemName: string;
  currentStock: number;
  onSuccess?: () => void;
}

const REASONS = [
  'Penjualan',
  'Restock',
  'Rusak',
  'Return',
  'Adjustment',
  'Lainnya'
];

export default function QuickStockModal({
  visible,
  onClose,
  itemId,
  itemName,
  currentStock,
  onSuccess
}: QuickStockModalProps) {
  const [adjustment, setAdjustment] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedReason, setSelectedReason] = useState('Penjualan');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const { isOnline, refreshPendingCount } = useOffline();

  const handleQuickAdjust = (amount: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAdjustment(prev => prev + amount);
    setCustomAmount('');
  };

  const handleCustomAmount = (text: string) => {
    setCustomAmount(text);
    const num = parseInt(text);
    if (!isNaN(num)) {
      setAdjustment(num);
    }
  };

  const handleSave = async () => {
    const newStock = currentStock + adjustment;
    
    if (newStock < 0) {
      Alert.alert('Error', 'Stok tidak boleh kurang dari 0!');
      return;
    }

    if (adjustment === 0) {
      Alert.alert('Error', 'Tidak ada perubahan stok!');
      return;
    }

    setLoading(true);
    try {
      if (isOnline) {
        // Online mode - update directly to Firestore
        const itemRef = doc(db, 'inventory', itemId);
        await updateDoc(itemRef, {
          stock: newStock,
          updated_at: serverTimestamp()
        });

        // Create transaction log
        await addDoc(collection(db, 'transactions'), {
          item_id: itemId,
          item_name: itemName,
          type: adjustment > 0 ? 'in' : 'out',
          quantity: Math.abs(adjustment),
          reason: selectedReason,
          notes: notes || '',
          timestamp: serverTimestamp(),
          user: 'Admin',
          old_stock: currentStock,
          new_stock: newStock
        });

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert('Sukses', `Stok berhasil diperbarui!\n${currentStock} → ${newStock}`);
      } else {
        // Offline mode - save to pending changes
        await updateItemInCache({ id: itemId, stock: newStock } as any);
        
        await addPendingChange({
          id: generateChangeId(),
          type: 'stock_adjust',
          collection: 'inventory',
          data: {
            newStock,
            item_name: itemName,
            type: adjustment > 0 ? 'in' : 'out',
            quantity: Math.abs(adjustment),
            reason: selectedReason,
            notes: notes || '',
            user: 'Admin',
            old_stock: currentStock,
          },
          timestamp: Date.now(),
          itemId: itemId,
        });
        
        await refreshPendingCount();
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          'Tersimpan Offline',
          `Stok diperbarui secara lokal!\n${currentStock} → ${newStock}\nAkan disinkronkan saat online.`
        );
      }
      
      // Reset form
      setAdjustment(0);
      setCustomAmount('');
      setNotes('');
      setSelectedReason('Penjualan');
      
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error('Error updating stock:', error);
      Alert.alert('Error', 'Gagal memperbarui stok.');
    } finally {
      setLoading(false);
    }
  };

  const newStock = currentStock + adjustment;
  const isValid = newStock >= 0 && adjustment !== 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Header */}
            <View style={styles.header}>
              <View>
                <Text style={styles.headerTitle}>Quick Adjust Stock</Text>
                <Text style={styles.itemName} numberOfLines={1}>{itemName}</Text>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Current Stock Display */}
            <View style={styles.stockDisplay}>
              <Text style={styles.stockLabel}>Stok Saat Ini</Text>
              <Text style={styles.stockValue}>{currentStock}</Text>
            </View>

            {/* Quick Adjust Buttons */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Adjustment Cepat</Text>
              <View style={styles.quickButtons}>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.quickButtonMinus]} 
                  onPress={() => handleQuickAdjust(-5)}
                >
                  <Text style={styles.quickButtonText}>-5</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.quickButtonMinus]} 
                  onPress={() => handleQuickAdjust(-1)}
                >
                  <Text style={styles.quickButtonText}>-1</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.quickButtonPlus]} 
                  onPress={() => handleQuickAdjust(1)}
                >
                  <Text style={styles.quickButtonText}>+1</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.quickButton, styles.quickButtonPlus]} 
                  onPress={() => handleQuickAdjust(5)}
                >
                  <Text style={styles.quickButtonText}>+5</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Custom Amount */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Custom Amount</Text>
              <TextInput
                style={styles.customInput}
                placeholder="Masukkan jumlah (+/- angka)"
                placeholderTextColor={Colors.text.secondary}
                keyboardType="numeric"
                value={customAmount}
                onChangeText={handleCustomAmount}
              />
            </View>

            {/* Current Adjustment Preview */}
            <View style={[styles.previewBox, newStock < 0 && styles.previewBoxError]}>
              <Text style={styles.previewLabel}>Preview:</Text>
              <Text style={styles.previewText}>
                {currentStock} {adjustment >= 0 ? '+' : ''}{adjustment} = {newStock}
              </Text>
              {newStock < 0 && (
                <Text style={styles.errorText}>⚠️ Stok tidak boleh negatif!</Text>
              )}
            </View>

            {/* Reason Selection */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Alasan</Text>
              <View style={styles.reasonChips}>
                {REASONS.map((reason) => (
                  <TouchableOpacity
                    key={reason}
                    style={[
                      styles.reasonChip,
                      selectedReason === reason && styles.reasonChipActive
                    ]}
                    onPress={() => {
                      setSelectedReason(reason);
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.reasonChipText,
                        selectedReason === reason && styles.reasonChipTextActive
                      ]}
                    >
                      {reason}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Notes */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Catatan (Opsional)</Text>
              <TextInput
                style={styles.notesInput}
                placeholder="Tambahkan catatan..."
                placeholderTextColor={Colors.text.secondary}
                multiline
                numberOfLines={3}
                value={notes}
                onChangeText={setNotes}
              />
            </View>

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!isValid || loading) && styles.saveButtonDisabled
              ]}
              onPress={handleSave}
              disabled={!isValid || loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'MENYIMPAN...' : 'SIMPAN PERUBAHAN'}
              </Text>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.background.card,
    borderTopLeftRadius: BorderRadius.card,
    borderTopRightRadius: BorderRadius.card,
    maxHeight: '90%',
    padding: Spacing.pagePadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  itemName: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 4,
  },
  closeButton: {
    padding: 4,
  },
  stockDisplay: {
    backgroundColor: Colors.primary,
    padding: Spacing.cardPadding,
    borderRadius: BorderRadius.input,
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  stockLabel: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.onPrimary,
    opacity: 0.8,
  },
  stockValue: {
    fontSize: 48,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary,
  },
  section: {
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    fontSize: FontSize.body,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
    marginBottom: Spacing.sm,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  quickButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    ...Shadow.soft,
  },
  quickButtonMinus: {
    backgroundColor: Colors.badge.stockOut.bg,
  },
  quickButtonPlus: {
    backgroundColor: Colors.badge.category.bg,
  },
  quickButtonText: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  customInput: {
    backgroundColor: Colors.input.background,
    padding: 16,
    borderRadius: BorderRadius.input,
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    borderWidth: 2,
    borderColor: Colors.input.border,
    color: Colors.text.primary,
  },
  previewBox: {
    backgroundColor: Colors.iconBox.yellow,
    padding: Spacing.md,
    borderRadius: BorderRadius.input,
    marginBottom: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.primary,
  },
  previewBoxError: {
    backgroundColor: Colors.badge.stockOut.bg,
    borderColor: Colors.badge.stockOut.text,
  },
  previewLabel: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  previewText: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  errorText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.badge.stockOut.text,
    marginTop: 4,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  reasonChip: {
    backgroundColor: Colors.input.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.badge,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  reasonChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  reasonChipText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
  },
  reasonChipTextActive: {
    color: Colors.text.onPrimary,
  },
  notesInput: {
    backgroundColor: Colors.input.background,
    padding: 16,
    borderRadius: BorderRadius.input,
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    borderWidth: 2,
    borderColor: Colors.input.border,
    color: Colors.text.primary,
    textAlignVertical: 'top',
    minHeight: 80,
  },
  saveButton: {
    backgroundColor: Colors.primary,
    padding: 18,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    ...Shadow.button,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary,
  },
});
