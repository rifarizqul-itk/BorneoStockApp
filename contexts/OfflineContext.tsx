// Offline Context for managing offline state and sync

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { 
  syncAllPendingChanges, 
  getPendingChangesCount,
  hasPendingChanges 
} from '@/utils/offlineSync';
import { 
  saveInventoryCache, 
  loadInventoryCache 
} from '@/utils/storage';
import { InventoryItem } from '@/types/inventory';

interface OfflineContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingChangesCount: number;
  lastSyncTime: Date | null;
  triggerSync: () => Promise<void>;
  refreshPendingCount: () => Promise<void>;
}

const OfflineContext = createContext<OfflineContextType | undefined>(undefined);

interface OfflineProviderProps {
  children: ReactNode;
}

export const OfflineProvider: React.FC<OfflineProviderProps> = ({ children }) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingChangesCount, setPendingChangesCount] = useState(0);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [wasOffline, setWasOffline] = useState(false);

  // Monitor network connection
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      
      if (!isOnline && online && wasOffline) {
        // Connection restored after being offline
        console.log('Connection restored, triggering auto-sync...');
        triggerSync();
      }
      
      if (!online) {
        setWasOffline(true);
      }
      
      setIsOnline(online);
    });

    return () => unsubscribe();
  }, [isOnline, wasOffline]);

  // Refresh pending changes count
  const refreshPendingCount = async () => {
    try {
      const count = await getPendingChangesCount();
      setPendingChangesCount(count);
    } catch (error) {
      console.error('Error refreshing pending count:', error);
    }
  };

  // Check for pending changes on mount
  useEffect(() => {
    refreshPendingCount();
  }, []);

  // Trigger sync manually
  const triggerSync = async () => {
    if (!isOnline) {
      console.log('Cannot sync while offline');
      return;
    }

    if (isSyncing) {
      console.log('Sync already in progress');
      return;
    }

    const hasPending = await hasPendingChanges();
    if (!hasPending) {
      console.log('No pending changes to sync');
      return;
    }

    setIsSyncing(true);
    
    try {
      console.log('Starting sync...');
      const results = await syncAllPendingChanges();
      
      console.log(`Sync completed: ${results.success} succeeded, ${results.failed} failed`);
      
      if (results.errors.length > 0) {
        console.error('Sync errors:', results.errors);
        // You could show a user notification here
      }
      
      setLastSyncTime(new Date());
      await refreshPendingCount();
      
      if (results.failed === 0) {
        setWasOffline(false);
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      setIsSyncing(false);
    }
  };

  const value: OfflineContextType = {
    isOnline,
    isSyncing,
    pendingChangesCount,
    lastSyncTime,
    triggerSync,
    refreshPendingCount,
  };

  return (
    <OfflineContext.Provider value={value}>
      {children}
    </OfflineContext.Provider>
  );
};

/**
 * Hook to use offline context
 */
export const useOffline = (): OfflineContextType => {
  const context = useContext(OfflineContext);
  if (context === undefined) {
    throw new Error('useOffline must be used within an OfflineProvider');
  }
  return context;
};
