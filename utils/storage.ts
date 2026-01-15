// AsyncStorage wrapper utilities for offline data management

import AsyncStorage from '@react-native-async-storage/async-storage';
import { InventoryItem, PendingChange } from '@/types/inventory';

const STORAGE_KEYS = {
  INVENTORY_CACHE: 'inventory_cache',
  INVENTORY_TIMESTAMP: 'inventory_timestamp',
  PENDING_CHANGES: 'pending_changes',
  FILTERS: 'inventory_filters',
};

/**
 * Save inventory data to cache
 */
export const saveInventoryCache = async (items: InventoryItem[]): Promise<void> => {
  try {
    await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY_CACHE, JSON.stringify(items));
    await AsyncStorage.setItem(STORAGE_KEYS.INVENTORY_TIMESTAMP, Date.now().toString());
  } catch (error) {
    console.error('Error saving inventory cache:', error);
    throw error;
  }
};

/**
 * Load inventory data from cache
 */
export const loadInventoryCache = async (): Promise<InventoryItem[]> => {
  try {
    const cached = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_CACHE);
    return cached ? JSON.parse(cached) : [];
  } catch (error) {
    console.error('Error loading inventory cache:', error);
    return [];
  }
};

/**
 * Get last sync timestamp
 */
export const getLastSyncTimestamp = async (): Promise<number> => {
  try {
    const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.INVENTORY_TIMESTAMP);
    return timestamp ? parseInt(timestamp) : 0;
  } catch (error) {
    console.error('Error getting last sync timestamp:', error);
    return 0;
  }
};

/**
 * Add a pending change to the queue
 */
export const addPendingChange = async (change: PendingChange): Promise<void> => {
  try {
    const existing = await getPendingChanges();
    existing.push(change);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(existing));
  } catch (error) {
    console.error('Error adding pending change:', error);
    throw error;
  }
};

/**
 * Get all pending changes
 */
export const getPendingChanges = async (): Promise<PendingChange[]> => {
  try {
    const pending = await AsyncStorage.getItem(STORAGE_KEYS.PENDING_CHANGES);
    return pending ? JSON.parse(pending) : [];
  } catch (error) {
    console.error('Error getting pending changes:', error);
    return [];
  }
};

/**
 * Remove a pending change from the queue
 */
export const removePendingChange = async (changeId: string): Promise<void> => {
  try {
    const existing = await getPendingChanges();
    const filtered = existing.filter(change => change.id !== changeId);
    await AsyncStorage.setItem(STORAGE_KEYS.PENDING_CHANGES, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing pending change:', error);
    throw error;
  }
};

/**
 * Clear all pending changes
 */
export const clearPendingChanges = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEYS.PENDING_CHANGES);
  } catch (error) {
    console.error('Error clearing pending changes:', error);
    throw error;
  }
};

/**
 * Update a single item in cache
 */
export const updateItemInCache = async (item: InventoryItem): Promise<void> => {
  try {
    const cache = await loadInventoryCache();
    const index = cache.findIndex(i => i.id === item.id);
    
    if (index >= 0) {
      cache[index] = item;
    } else {
      cache.push(item);
    }
    
    await saveInventoryCache(cache);
  } catch (error) {
    console.error('Error updating item in cache:', error);
    throw error;
  }
};

/**
 * Remove an item from cache
 */
export const removeItemFromCache = async (itemId: string): Promise<void> => {
  try {
    const cache = await loadInventoryCache();
    const filtered = cache.filter(item => item.id !== itemId);
    await saveInventoryCache(filtered);
  } catch (error) {
    console.error('Error removing item from cache:', error);
    throw error;
  }
};

/**
 * Clear all cached data
 */
export const clearAllCache = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      STORAGE_KEYS.INVENTORY_CACHE,
      STORAGE_KEYS.INVENTORY_TIMESTAMP,
    ]);
  } catch (error) {
    console.error('Error clearing cache:', error);
    throw error;
  }
};
