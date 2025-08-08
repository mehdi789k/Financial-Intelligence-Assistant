
import { useState, useEffect, useCallback } from 'react';
import type { UploadedFile, AnalysisRecord } from '../types';
import { 
    getAllFilesFromDB, 
    addFilesToDB, 
    removeFileFromDB, 
    clearFilesFromDB,
    addAnalysisToDB, 
    getAllAnalysesFromDB, 
    removeAnalysisFromDB as removeAnalysisFromDBService,
    clearAnalysesFromDB,
    clearKnowledgeFromDB,
    replaceHistoryInDB,
    replaceFilesInDB
} from '../services/db';

export const useFileStore = () => {
    const [archivedFiles, setArchivedFiles] = useState<UploadedFile[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const loadFiles = useCallback(async () => {
        try {
            const storedFiles = await getAllFilesFromDB();
            setArchivedFiles(storedFiles);
        } catch (error) {
            console.error("Failed to load files from DB", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);
    
    useEffect(() => {
        loadFiles();
    }, [loadFiles]);

    const addFilesToArchive = useCallback(async (newFiles: UploadedFile[]) => {
        try {
            await addFilesToDB(newFiles);
            const allFiles = await getAllFilesFromDB();
            setArchivedFiles(allFiles);
        } catch (error) {
            console.error("Failed to add files to DB", error);
            throw error; // Re-throw to allow component-level error handling
        }
    }, []);

    const removeFileFromArchive = useCallback(async (key: { symbol: string; name: string }) => {
        try {
            await removeFileFromDB(key);
            setArchivedFiles(prevFiles => prevFiles.filter(f => f.name !== key.name || f.symbol !== key.symbol));
        } catch (error) {
            console.error("Failed to remove file from DB", error);
        }
    }, []);

    const clearFiles = useCallback(async () => {
        try {
            await clearFilesFromDB();
            setArchivedFiles([]);
        } catch (error) {
            console.error("Failed to clear files from DB", error);
        }
    }, []);

    const replaceAllFiles = useCallback(async (files: UploadedFile[]) => {
        try {
            await replaceFilesInDB(files);
            await loadFiles();
        } catch (error) {
            console.error("Failed to replace files in DB", error);
        }
    }, [loadFiles]);


    return { archivedFiles, addFilesToArchive, removeFileFromArchive, clearFiles, replaceAllFiles, isInitialized };
};

export const useAnalysisHistory = () => {
    const [history, setHistory] = useState<AnalysisRecord[]>([]);
    const [isInitialized, setIsInitialized] = useState(false);

    const loadHistory = useCallback(async () => {
        try {
            const storedHistory = await getAllAnalysesFromDB();
            setHistory(storedHistory);
        } catch (error) {
            console.error("Failed to load analysis history from DB", error);
        } finally {
            setIsInitialized(true);
        }
    }, []);

    useEffect(() => {
        loadHistory();
    }, [loadHistory]);

    const addAnalysisToHistory = useCallback(async (record: Omit<AnalysisRecord, 'id'>): Promise<number | undefined> => {
        try {
            const newId = await addAnalysisToDB(record);
            await loadHistory(); // Reload to get the new record with its ID and sorted
            return newId;
        } catch (error) {
            console.error("Failed to add analysis to DB", error);
            return undefined;
        }
    }, [loadHistory]);

    const removeAnalysisFromHistory = useCallback(async (id: number) => {
        try {
            await removeAnalysisFromDBService(id);
            setHistory(prevHistory => prevHistory.filter(r => r.id !== id));
        } catch (error) {
            console.error("Failed to remove analysis from DB", error);
        }
    }, []);
    
    const clearHistory = useCallback(async () => {
        try {
            await clearAnalysesFromDB();
            await clearKnowledgeFromDB(); // Also clear associated knowledge
            setHistory([]);
        } catch (error) {
            console.error("Failed to clear history and knowledge from DB", error);
        }
    }, []);

    const replaceAllHistory = useCallback(async (records: AnalysisRecord[]) => {
        try {
            await replaceHistoryInDB(records);
            await loadHistory();
        } catch (error)
        {
            console.error("Failed to replace history in DB", error);
        }
    }, [loadHistory]);


    return { history, addAnalysisToHistory, removeAnalysisFromHistory, clearHistory, replaceAllHistory, isInitialized };
};
