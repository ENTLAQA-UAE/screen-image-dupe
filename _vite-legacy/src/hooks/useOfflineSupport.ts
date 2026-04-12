import { useState, useEffect, useCallback } from 'react';

interface OfflineData {
  answers: Record<string, any>;
  participantId: string | null;
  assessmentId: string | null;
  timestamp: number;
}

const OFFLINE_STORAGE_KEY = 'assessment_offline_data';

export function useOfflineSupport() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [hasPendingData, setHasPendingData] = useState(false);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Check for pending data on mount
    const pending = localStorage.getItem(OFFLINE_STORAGE_KEY);
    setHasPendingData(!!pending);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Save answers locally for offline recovery
  const saveOfflineData = useCallback((data: Omit<OfflineData, 'timestamp'>) => {
    try {
      const offlineData: OfflineData = {
        ...data,
        timestamp: Date.now(),
      };
      localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(offlineData));
      setHasPendingData(true);
    } catch (error) {
      console.error('Failed to save offline data:', error);
    }
  }, []);

  // Load saved offline data
  const loadOfflineData = useCallback((): OfflineData | null => {
    try {
      const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load offline data:', error);
    }
    return null;
  }, []);

  // Clear offline data after successful submission
  const clearOfflineData = useCallback(() => {
    try {
      localStorage.removeItem(OFFLINE_STORAGE_KEY);
      setHasPendingData(false);
    } catch (error) {
      console.error('Failed to clear offline data:', error);
    }
  }, []);

  // Check if data is stale (older than 24 hours)
  const isDataStale = useCallback((data: OfflineData): boolean => {
    const twentyFourHours = 24 * 60 * 60 * 1000;
    return Date.now() - data.timestamp > twentyFourHours;
  }, []);

  return {
    isOnline,
    hasPendingData,
    saveOfflineData,
    loadOfflineData,
    clearOfflineData,
    isDataStale,
  };
}
