
import { useState, useEffect, useCallback } from 'react';
import type { LearnedTechnique } from '../types';
import {
    addTechniquesToDB,
    getAllTechniquesFromDB,
    updateTechniqueInDB,
    deleteTechniqueFromDB,
    replaceTechniquesInDB,
    clearTechniquesFromDB
} from '../services/db';

export const useTechniques = () => {
    const [techniques, setTechniques] = useState<LearnedTechnique[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const loadTechniques = useCallback(async () => {
        try {
            const items = await getAllTechniquesFromDB();
            setTechniques(items);
        } catch (error) {
            console.error("Failed to load techniques from DB", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        loadTechniques();
    }, [loadTechniques]);

    const addTechniques = useCallback(async (newTechniques: Omit<LearnedTechnique, 'id'>[]) => {
        try {
            await addTechniquesToDB(newTechniques);
            await loadTechniques();
        } catch (error) {
            console.error("Failed to add techniques to DB", error);
            throw error;
        }
    }, [loadTechniques]);

    const updateTechnique = useCallback(async (technique: LearnedTechnique) => {
        try {
            await updateTechniqueInDB(technique);
            await loadTechniques();
        } catch (error) {
            console.error("Failed to update technique in DB", error);
            throw error;
        }
    }, [loadTechniques]);

    const deleteTechnique = useCallback(async (id: number) => {
        try {
            await deleteTechniqueFromDB(id);
            setTechniques(prev => prev.filter(t => t.id !== id));
        } catch (error) {
            console.error("Failed to delete technique from DB", error);
            throw error;
        }
    }, []);

    const replaceAllTechniques = useCallback(async (items: LearnedTechnique[]) => {
        try {
            await replaceTechniquesInDB(items);
            await loadTechniques();
        } catch (error) {
            console.error("Failed to replace techniques in DB", error);
        }
    }, [loadTechniques]);
    
    const clearTechniques = useCallback(async () => {
        try {
            await clearTechniquesFromDB();
            setTechniques([]);
        } catch (error) {
            console.error("Failed to clear techniques from DB", error);
            throw error;
        }
    }, []);

    return { techniques, isInitialized, addTechniques, updateTechnique, deleteTechnique, replaceAllTechniques, clearTechniques };
};
