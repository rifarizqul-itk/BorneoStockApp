import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, BorderRadius, FontSize, Shadow } from '@/constants/theme';
import { InventoryItem } from '@/types/inventory';

export default function SelectVariantScreen() {
  const { parentId } = useLocalSearchParams();
  const router = useRouter();
  const [parentItem, setParentItem] = useState<InventoryItem | null>(null);
  const [variants, setVariants] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchVariants = async () => {
      try {
        // Fetch parent item
        const parentRef = doc(db, 'inventory', parentId as string);
        const parentSnap = await getDoc(parentRef);
        
        if (parentSnap.exists()) {
          const parentData = { id: parentSnap.id, ...parentSnap.data() } as InventoryItem;
          setParentItem(parentData);
          
          // Fetch all variants
          if (parentData.variants && parentData.variants.length > 0) {
            const variantPromises = parentData.variants.map(variantId =>
              getDoc(doc(db, 'inventory', variantId))
            );
            const variantSnaps = await Promise.all(variantPromises);
            const variantData = variantSnaps
              .filter(snap => snap.exists())
              .map(snap => ({ id: snap.id, ...snap.data() } as InventoryItem));
            setVariants(variantData);
          }
        }
      } catch (error) {
        console.error('Error fetching variants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchVariants();
  }, [parentId]);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={Colors.primary} style={{ marginTop: 100 }} />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Pilih Varian</Text>
        <Text style={styles.subtitle}>{parentItem?.name}</Text>
      </View>

      <View style={styles.content}>
        {/* View Parent Button */}
        <TouchableOpacity
          style={styles.parentCard}
          onPress={() => router.replace(`/item/${parentId}` as any)}
        >
          <View style={styles.parentIcon}>
            <Ionicons name="file-tray-full-outline" size={28} color={Colors.primary} />
          </View>
          <View style={styles.parentInfo}>
            <Text style={styles.parentTitle}>Lihat Item Utama</Text>
            <Text style={styles.parentSubtitle}>
              Total {variants.reduce((sum, v) => sum + (v.stock || 0), 0)} unit dari semua varian
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color={Colors.text.secondary} />
        </TouchableOpacity>

        {/* Variant List */}
        <Text style={styles.sectionHeader}>Pilih Varian:</Text>
        {variants.map((variant) => (
          <TouchableOpacity
            key={variant.id}
            style={styles.variantCard}
            onPress={() => router.replace(`/item/${variant.id}` as any)}
          >
            <View style={styles.variantIconBox}>
              <Ionicons name="cube" size={24} color={Colors.primary} />
            </View>
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

        {variants.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="cube-outline" size={64} color={Colors.text.secondary} />
            <Text style={styles.emptyText}>Tidak ada varian tersedia</Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.main,
  },
  header: {
    padding: Spacing.pagePadding,
    paddingTop: Spacing.pageTop,
  },
  title: {
    fontSize: FontSize.h1,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
  },
  subtitle: {
    fontSize: FontSize.h3,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 4,
  },
  content: {
    padding: Spacing.pagePadding,
  },
  parentCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.lg,
    ...Shadow.soft,
  },
  parentIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  parentInfo: {
    flex: 1,
  },
  parentTitle: {
    fontSize: FontSize.h3,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.onPrimary,
  },
  parentSubtitle: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.onPrimary,
    opacity: 0.8,
    marginTop: 2,
  },
  sectionHeader: {
    fontSize: FontSize.h2,
    fontFamily: 'Poppins_700Bold',
    color: Colors.text.primary,
    marginBottom: Spacing.md,
  },
  variantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.card,
    padding: Spacing.md,
    borderRadius: BorderRadius.card,
    marginBottom: Spacing.sm,
    ...Shadow.soft,
  },
  variantIconBox: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: Colors.iconBox.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
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
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: FontSize.body,
    fontFamily: 'Inter_400Regular',
    color: Colors.text.secondary,
    marginTop: 16,
  },
});
