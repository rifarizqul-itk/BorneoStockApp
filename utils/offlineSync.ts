// Offline sync utilities for syncing pending changes to Firestore

import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { PendingChange } from '@/types/inventory';
import { 
  getPendingChanges, 
  removePendingChange,
  updateItemInCache,
  removeItemFromCache
} from './storage';
import uuid from 'react-native-uuid';

/**
 * Generate a unique ID for pending changes
 */
export const generateChangeId = (): string => {
  return uuid.v4() as string;
};

/**
 * Process a single pending change
 */
export const processPendingChange = async (change: PendingChange): Promise<boolean> => {
  try {
    switch (change.type) {
      case 'add':
        await handleAddChange(change);
        break;
      case 'update':
        await handleUpdateChange(change);
        break;
      case 'delete':
        await handleDeleteChange(change);
        break;
      default:
        console.warn('Unknown change type:', change.type);
        return false;
    }
    return true;
  } catch (error) {
    console.error('Error processing pending change:', error);
    return false;
  }
};

/**
 * Handle 'add' type change
 */
const handleAddChange = async (change: PendingChange): Promise<void> => {
  const docRef = await addDoc(collection(db, change.collection), {
    ...change.data,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  
  // Update cache with the new Firestore ID
  if (change.collection === 'inventory') {
    await updateItemInCache({ ...change.data, id: docRef.id });
  }
};

/**
 * Handle 'update' type change
 */
const handleUpdateChange = async (change: PendingChange): Promise<void> => {
  if (!change.itemId) {
    throw new Error('Item ID is required for update operation');
  }
  
  const docRef = doc(db, change.collection, change.itemId);
  await updateDoc(docRef, {
    ...change.data,
    updated_at: serverTimestamp(),
  });
  
  // Update cache
  if (change.collection === 'inventory') {
    await updateItemInCache({ ...change.data, id: change.itemId });
  }
};

/**
 * Handle 'delete' type change
 */
const handleDeleteChange = async (change: PendingChange): Promise<void> => {
  if (!change.itemId) {
    throw new Error('Item ID is required for delete operation');
  }
  
  const docRef = doc(db, change.collection, change.itemId);
  await deleteDoc(docRef);
  
  // Remove from cache
  if (change.collection === 'inventory') {
    await removeItemFromCache(change.itemId);
  }
};

/**
 * Sync all pending changes to Firestore
 */
export const syncAllPendingChanges = async (): Promise<{
  success: number;
  failed: number;
  errors: Array<{ change: PendingChange; error: string }>;
}> => {
  const pendingChanges = await getPendingChanges();
  const results = {
    success: 0,
    failed: 0,
    errors: [] as Array<{ change: PendingChange; error: string }>,
  };
  
  for (const change of pendingChanges) {
    try {
      const success = await processPendingChange(change);
      if (success) {
        await removePendingChange(change.id);
        results.success++;
      } else {
        results.failed++;
        results.errors.push({
          change,
          error: 'Failed to process change'
        });
      }
    } catch (error) {
      results.failed++;
      results.errors.push({
        change,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
      console.error('Error syncing change:', change, error);
    }
  }
  
  return results;
};

/**
 * Check if there are any pending changes
 */
export const hasPendingChanges = async (): Promise<boolean> => {
  const changes = await getPendingChanges();
  return changes.length > 0;
};

/**
 * Get count of pending changes
 */
export const getPendingChangesCount = async (): Promise<number> => {
  const changes = await getPendingChanges();
  return changes.length;
};
