import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, Alert, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListHeirs, AddHeir, EditHeir } from '../../components/heirs';
import type { Heir, HeirFormData } from '../../types/heir';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

const HEIRS_STORAGE_KEY = '@SignOff:heirs';

interface StoredHeir extends Omit<Heir, 'createdAt' | 'updatedAt'> {
  createdAt: string;
  updatedAt: string;
}

export default function HeirsScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [currentHeir, setCurrentHeir] = useState<Heir | null>(null);

  // Save heirs to AsyncStorage
  const saveHeirsToStorage = useCallback(async (heirsToSave: Heir[]) => {
    try {
      const jsonValue = JSON.stringify(heirsToSave);
      await AsyncStorage.setItem(HEIRS_STORAGE_KEY, jsonValue);
      return true;
    } catch (error) {
      console.error('Failed to save heirs', error);
      Alert.alert('Error', 'Failed to save heirs to storage');
      return false;
    }
  }, []);

  // Load heirs from AsyncStorage on mount
  useEffect(() => {
    const loadHeirs = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(HEIRS_STORAGE_KEY);
        if (jsonValue !== null) {
          const storedHeirs = JSON.parse(jsonValue) as StoredHeir[];
          setHeirs(storedHeirs);
        }
      } catch (error) {
        console.error('Failed to load heirs', error);
        Alert.alert('Error', 'Failed to load heirs from storage');
      }
    };
    
    loadHeirs();
  }, []);

  // Save to storage whenever heirs change
  useEffect(() => {
    if (heirs.length > 0) {
      saveHeirsToStorage(heirs);
    }
  }, [heirs, saveHeirsToStorage]);

  const handleAddHeir = async (data: HeirFormData) => {
    const newHeir: Heir = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedHeirs = [...heirs, newHeir];
    setHeirs(updatedHeirs);
    await saveHeirsToStorage(updatedHeirs);
    setView('list');
  };

  const handleUpdateHeir = async (data: HeirFormData & { id: string }) => {
    const updatedHeirs = heirs.map(heir =>
      heir.id === data.id
        ? { ...heir, ...data, updatedAt: new Date().toISOString() }
        : heir
    );
    
    setHeirs(updatedHeirs);
    await saveHeirsToStorage(updatedHeirs);
    setView('list');
    setCurrentHeir(null);
  };

  const handleDeleteHeir = async (id: string) => {
    const updatedHeirs = heirs.filter(heir => heir.id !== id);
    setHeirs(updatedHeirs);
    await saveHeirsToStorage(updatedHeirs);
    
    if (currentHeir?.id === id) {
      setCurrentHeir(null);
      setView('list');
    }
  };

  const handleEditHeir = (heir: Heir) => {
    setCurrentHeir(heir);
    setView('edit');
  };

  const renderContent = () => {
    switch (view) {
      case 'add':
        return (
          <AddHeir
            onSubmit={handleAddHeir}
            onCancel={() => setView('list')}
            existingHeirs={heirs}
          />
        );
      case 'edit':
        return currentHeir ? (
          <EditHeir
            heir={currentHeir}
            existingHeirs={heirs.filter(h => h.id !== currentHeir.id)}
            onSave={handleUpdateHeir}
            onCancel={() => setView('list')}
            onDelete={handleDeleteHeir}
          />
        ) : null;
      case 'list':
      default:
        return (
          <ListHeirs
            heirs={heirs}
            onEdit={handleEditHeir}
            onDelete={handleDeleteHeir}
            onAdd={() => setView('add')}
          />
        );
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      <View style={styles.content}>
        {renderContent()}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingBottom: 120, // Augmenté pour éviter que le contenu soit caché par la tab bar
  },
});
