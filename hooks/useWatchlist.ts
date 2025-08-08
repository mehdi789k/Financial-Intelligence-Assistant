
import { useState, useEffect, useCallback } from 'react';
import type { WatchlistItem } from '../types';
import { 
    addSymbolToWatchlistDB, 
    removeSymbolFromWatchlistDB,
    getAllWatchlistItemsDB,
    clearWatchlistFromDB,
    replaceWatchlistInDB
} from '../services/db';

export const useWatchlist = () => {
    const [watchlist, setWatchlist] = useState<WatchlistItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const loadWatchlist = useCallback(async () => {
        try {
            const items = await getAllWatchlistItemsDB();
            setWatchlist(items);
        } catch (error) {
            console.error("Failed to load watchlist from DB", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        loadWatchlist();
    }, [loadWatchlist]);

    const addToWatchlist = useCallback(async (symbol: string) => {
        if (!symbol || watchlist.some(item => item.symbol === symbol)) return;
        try {
            await addSymbolToWatchlistDB({ symbol, addedAt: Date.now() });
            await loadWatchlist(); // Reload to get the new item and be sorted
        } catch (error) {
            console.error("Failed to add to watchlist", error);
        }
    }, [watchlist, loadWatchlist]);

    const removeFromWatchlist = useCallback(async (symbol: string) => {
        try {
            await removeSymbolFromWatchlistDB(symbol);
            setWatchlist(prev => prev.filter(item => item.symbol !== symbol));
        } catch (error) {
            console.error("Failed to remove from watchlist", error);
        }
    }, []);

    const isSymbolInWatchlist = useCallback((symbol: string): boolean => {
        return watchlist.some(item => item.symbol === symbol);
    }, [watchlist]);
    
    const clearWatchlist = useCallback(async () => {
        try {
            await clearWatchlistFromDB();
            setWatchlist([]);
        } catch (error) {
            console.error("Failed to clear watchlist from DB", error);
        }
    }, []);
    
    const replaceAllWatchlistItems = useCallback(async (items: WatchlistItem[]) => {
        try {
            await replaceWatchlistInDB(items);
            await loadWatchlist();
        } catch (error) {
            console.error("Failed to replace watchlist in DB", error);
        }
    }, [loadWatchlist]);


    return { watchlist, isInitialized, addToWatchlist, removeFromWatchlist, isSymbolInWatchlist, clearWatchlist, replaceAllWatchlistItems };
};