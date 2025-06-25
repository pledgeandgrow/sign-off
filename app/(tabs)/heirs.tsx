import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Alert } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ListHeirs, AddHeir, EditHeir } from '../../components/heirs';
import type { Heir, HeirFormData } from '../../types/heir';

const HEIRS_STORAGE_KEY = '@SignOff:heirs';

export default function HeirsScreen() {
  const insets = useSafeAreaInsets();
  const [heirs, setHeirs] = useState<Heir[]>([]);
  const [view, setView] = useState<'list' | 'add' | 'edit'>('list');
  const [currentHeir, setCurrentHeir] = useState<Heir | null>(null);

  // Load heirs from AsyncStorage on mount
  useEffect(() => {
    const loadHeirs = async () => {
      try {
        const jsonValue = await AsyncStorage.getItem(HEIRS_STORAGE_KEY);
        if (jsonValue !== null) {
          const storedHeirs = JSON.parse(jsonValue) as Heir[];
          // Ensure all dates are properly parsed
          const parsedHeirs = storedHeirs.map(heir => ({
            ...heir,
            createdAt: new Date(heir.createdAt).toISOString(),
            updatedAt: new Date(heir.updatedAt).toISOString(),
          }));
          setHeirs(parsedHeirs);
        }
      } catch (error) {
        console.error('Failed to load heirs', error);
        Alert.alert('Error', 'Failed to load heirs from storage');
      }
    };
    
    loadHeirs();
  }, []);

  // Save heirs to AsyncStorage whenever the list changes
  useEffect(() => {
    const saveHeirs = async () => {
      try {
        const jsonValue = JSON.stringify(heirs);
        await AsyncStorage.setItem(HEIRS_STORAGE_KEY, jsonValue);
      } catch (error) {
        console.error('Failed to save heirs', error);
      }
    };

    if (heirs.length > 0) {
      saveHeirs();
    }
  }, [heirs]);

  const handleAddHeir = (data: HeirFormData) => {
    const newHeir: Heir = {
      ...data,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setHeirs(prevHeirs => [...prevHeirs, newHeir]);
    setView('list');
  };

  const handleUpdateHeir = (data: HeirFormData & { id: string }) => {
    setHeirs(prevHeirs =>
      prevHeirs.map(heir =>
        heir.id === data.id
          ? { ...heir, ...data, updatedAt: new Date().toISOString() }
          : heir
      )
    );
    setView('list');
    setCurrentHeir(null);
  };

  const handleDeleteHeir = (id: string) => {
    setHeirs(prevHeirs => prevHeirs.filter(heir => heir.id !== id));
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
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {view === 'list' && (
        <View style={styles.header}>
          <Text style={styles.title}>Heirs</Text>
        </View>
      )}
      <View style={styles.content}>
        {renderContent()}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: 'black',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    marginTop: 8,
  },
  placeholderText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
    textAlign: 'center',
  },
  placeholderSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 8,
    textAlign: 'center',
    marginBottom: 24,
  },
  addButton: {
    backgroundColor: 'black',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 44,
  },
  addButtonText: {
    color: 'white',
    fontWeight: '600',
    marginLeft: 8,
  },
});
