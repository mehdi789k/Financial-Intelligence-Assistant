
import { useState, useEffect, useCallback } from 'react';
import type { KnowledgeItem } from '../types';
import { 
    getAllKnowledgeItemsFromDB,
    updateKnowledgeItemInDB,
    deleteKnowledgeItemFromDB,
    replaceKnowledgeInDB,
    clearKnowledgeFromDB
} from '../services/db';

export const useKnowledge = () => {
    const [items, setItems] = useState<KnowledgeItem[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const loadItems = useCallback(async () => {
        try {
            const storedItems = await getAllKnowledgeItemsFromDB();
            setItems(storedItems);
        } catch (error) {
            console.error("Failed to load knowledge items from DB", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        loadItems();
    }, [loadItems]);

    const updateItem = useCallback(async (item: KnowledgeItem) => {
        try {
            await updateKnowledgeItemInDB(item);
            await loadItems(); // Refresh list
        } catch (error) {
            console.error("Failed to update knowledge item", error);
            throw error;
        }
    }, [loadItems]);

    const deleteItem = useCallback(async (id: number) => {
        try {
            await deleteKnowledgeItemFromDB(id);
            setItems(prev => prev.filter(item => item.id !== id));
        } catch (error) {
            console.error("Failed to delete knowledge item", error);
            throw error;
        }
    }, []);
    
    const replaceAllKnowledge = useCallback(async (knowledgeItems: KnowledgeItem[]) => {
        try {
            await replaceKnowledgeInDB(knowledgeItems);
            await loadItems();
        } catch (error) {
            console.error("Failed to replace knowledge items in DB", error);
        }
    }, [loadItems]);

    const clearKnowledge = useCallback(async () => {
        try {
            await clearKnowledgeFromDB();
            setItems([]);
        } catch (error) {
            console.error("Failed to clear knowledge from DB", error);
            throw error;
        }
    }, []);

    return { items, isInitialized, updateItem, deleteItem, reloadItems: loadItems, replaceAllKnowledge, clearKnowledge };
};
