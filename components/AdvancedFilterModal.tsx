import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { FilterState } from '@/types/inventory';
import * as Haptics from 'expo-haptics';

interface AdvancedFilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  currentFilters: FilterState;
  availableCategories: string[];
  availableLocations: string[];
  availableQualities: string[];
}

const STOCK_STATUS_OPTIONS = [
  { value: 'all', label: 'Semua' },
  { value: 'available', label: 'Tersedia (>0)' },
  { value: 'out', label: 'Habis (=0)' },
  { value: 'low', label: 'Menipis (<10)' },
];

export default function AdvancedFilterModal({
  visible,
  onClose,
  onApply,
  currentFilters,
  availableCategories,
  availableLocations,
  availableQualities,
}: AdvancedFilterModalProps) {
  const [filters, setFilters] = useState<FilterState>(currentFilters);

  useEffect(() => {
    setFilters(currentFilters);
  }, [currentFilters, visible]);

  const handleReset = () => {
    const defaultFilters: FilterState = {
      categories: [],
      locations: [],
      stockRange: { min: 0, max: 99999 },
      priceRange: { min: 0, max: 99999999 },
      qualities: [],
      stockStatus: 'all',
      sortBy: 'newest',
    };
    setFilters(defaultFilters);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleApply = () => {
    onApply(filters);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onClose();
  };

  const toggleArrayItem = (array: string[], item: string) => {
    if (array.includes(item)) {
      return array.filter(i => i !== item);
    }
    return [...array, item];
  };

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
              <Text style={styles.headerTitle}>Filter Lanjutan</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <Ionicons name="close" size={24} color={Colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Kategori */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kategori</Text>
              <View style={styles.chipContainer}>
                {availableCategories.map((category) => (
                  <TouchableOpacity
                    key={category}
                    style={[
                      styles.chip,
                      filters.categories.includes(category) && styles.chipActive
                    ]}
                    onPress={() => {
                      setFilters({
                        ...filters,
                        categories: toggleArrayItem(filters.categories, category)
                      });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.categories.includes(category) && styles.chipTextActive
                      ]}
                    >
                      {category}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Lokasi Rak */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Lokasi Rak</Text>
              <View style={styles.chipContainer}>
                {availableLocations.map((location) => (
                  <TouchableOpacity
                    key={location}
                    style={[
                      styles.chip,
                      filters.locations.includes(location) && styles.chipActive
                    ]}
                    onPress={() => {
                      setFilters({
                        ...filters,
                        locations: toggleArrayItem(filters.locations, location)
                      });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.locations.includes(location) && styles.chipTextActive
                      ]}
                    >
                      {location}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Kualitas */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Kualitas</Text>
              <View style={styles.chipContainer}>
                {availableQualities.map((quality) => (
                  <TouchableOpacity
                    key={quality}
                    style={[
                      styles.chip,
                      filters.qualities.includes(quality) && styles.chipActive
                    ]}
                    onPress={() => {
                      setFilters({
                        ...filters,
                        qualities: toggleArrayItem(filters.qualities, quality)
                      });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.qualities.includes(quality) && styles.chipTextActive
                      ]}
                    >
                      {quality}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Status Stok */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Status Stok</Text>
              <View style={styles.chipContainer}>
                {STOCK_STATUS_OPTIONS.map((option) => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.chip,
                      filters.stockStatus === option.value && styles.chipActive
                    ]}
                    onPress={() => {
                      setFilters({
                        ...filters,
                        stockStatus: option.value as any
                      });
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                  >
                    <Text
                      style={[
                        styles.chipText,
                        filters.stockStatus === option.value && styles.chipTextActive
                      ]}
                    >
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Range Stok */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Range Stok</Text>
              <View style={styles.rangeInputs}>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeLabel}>Min</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={filters.stockRange.min.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setFilters({
                        ...filters,
                        stockRange: { ...filters.stockRange, min: num }
                      });
                    }}
                  />
                </View>
                <Text style={styles.rangeSeparator}>—</Text>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeLabel}>Max</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={filters.stockRange.max === 99999 ? '' : filters.stockRange.max.toString()}
                    placeholder="Tak terbatas"
                    placeholderTextColor={Colors.text.secondary}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 99999;
                      setFilters({
                        ...filters,
                        stockRange: { ...filters.stockRange, max: num }
                      });
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Range Harga Jual */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Range Harga Jual</Text>
              <View style={styles.rangeInputs}>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeLabel}>Min</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={filters.priceRange.min.toString()}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 0;
                      setFilters({
                        ...filters,
                        priceRange: { ...filters.priceRange, min: num }
                      });
                    }}
                  />
                </View>
                <Text style={styles.rangeSeparator}>—</Text>
                <View style={styles.rangeInput}>
                  <Text style={styles.rangeLabel}>Max</Text>
                  <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={filters.priceRange.max === 99999999 ? '' : filters.priceRange.max.toString()}
                    placeholder="Tak terbatas"
                    placeholderTextColor={Colors.text.secondary}
                    onChangeText={(text) => {
                      const num = parseInt(text) || 99999999;
                      setFilters({
                        ...filters,
                        priceRange: { ...filters.priceRange, max: num }
                      });
                    }}
                  />
                </View>
              </View>
            </View>

            {/* Action Buttons */}
            <View style={styles.actions}>
              <TouchableOpacity
                style={styles.resetButton}
                onPress={handleReset}
              >
                <Text style={styles.resetButtonText}>Reset Filter</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.applyButton}
                onPress={handleApply}
              >
                <Text style={styles.applyButtonText}>Terapkan</Text>
              </TouchableOpacity>
            </View>
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
    maxHeight: '85%',
    padding: Spacing.pagePadding,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerTitle: {
    fontSize: FontSize.h1,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  closeButton: {
    padding: 4,
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
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  chip: {
    backgroundColor: Colors.input.background,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: BorderRadius.badge,
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  chipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  chipText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
  },
  chipTextActive: {
    color: Colors.text.onPrimary,
  },
  rangeInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  rangeInput: {
    flex: 1,
  },
  rangeLabel: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.text.secondary,
    marginBottom: 4,
  },
  rangeSeparator: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.secondary,
    marginTop: 20,
  },
  input: {
    backgroundColor: Colors.input.background,
    padding: 14,
    borderRadius: BorderRadius.input,
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    borderWidth: 2,
    borderColor: Colors.input.border,
    color: Colors.text.primary,
  },
  actions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  resetButton: {
    flex: 1,
    backgroundColor: Colors.background.main,
    padding: 16,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: Colors.input.border,
  },
  resetButtonText: {
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.text.primary,
  },
  applyButton: {
    flex: 1,
    backgroundColor: Colors.primary,
    padding: 16,
    borderRadius: BorderRadius.button,
    alignItems: 'center',
    ...Shadow.button,
  },
  applyButtonText: {
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary,
  },
});
