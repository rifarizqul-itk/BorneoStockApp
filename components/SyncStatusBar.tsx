// Sync Status Bar component to show online/offline status and sync progress

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '@/constants/theme';
import { useOffline } from '@/contexts/OfflineContext';
import * as Haptics from 'expo-haptics';

interface SyncStatusBarProps {
  showAlways?: boolean; // Show even when online with no pending changes
}

export default function SyncStatusBar({ showAlways = false }: SyncStatusBarProps) {
  const { isOnline, isSyncing, pendingChangesCount, triggerSync } = useOffline();

  // Don't show if online and no pending changes (unless showAlways is true)
  if (!showAlways && isOnline && pendingChangesCount === 0 && !isSyncing) {
    return null;
  }

  const handleSyncPress = () => {
    if (!isSyncing && isOnline && pendingChangesCount > 0) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      triggerSync();
    }
  };

  return (
    <View style={[
      styles.container,
      !isOnline && styles.containerOffline,
      isSyncing && styles.containerSyncing,
    ]}>
      <View style={styles.leftContent}>
        {isSyncing ? (
          <ActivityIndicator size="small" color={Colors.background.card} />
        ) : (
          <Ionicons 
            name={isOnline ? "cloud-done" : "cloud-offline"} 
            size={18} 
            color={Colors.background.card} 
          />
        )}
        <Text style={styles.statusText}>
          {isSyncing 
            ? 'Menyinkronkan...' 
            : isOnline 
              ? pendingChangesCount > 0 
                ? `${pendingChangesCount} perubahan belum tersinkronisasi`
                : '🟢 Online'
              : '🔴 Offline Mode'
          }
        </Text>
      </View>

      {isOnline && pendingChangesCount > 0 && !isSyncing && (
        <TouchableOpacity 
          style={styles.syncButton}
          onPress={handleSyncPress}
        >
          <Ionicons name="sync" size={16} color={Colors.background.card} />
          <Text style={styles.syncButtonText}>Sync</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.status.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  containerOffline: {
    backgroundColor: Colors.status.error,
  },
  containerSyncing: {
    backgroundColor: Colors.status.warning,
  },
  leftContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
  },
  statusText: {
    fontSize: FontSize.caption,
    fontFamily: 'Inter_600SemiBold',
    color: Colors.background.card,
    flex: 1,
  },
  syncButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  syncButtonText: {
    fontSize: FontSize.caption,
    fontFamily: 'Poppins_600SemiBold',
    color: Colors.background.card,
  },
});
