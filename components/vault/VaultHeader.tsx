import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Vault } from '@/types/vault';


type VaultHeaderProps = {
  vault: Vault;
  onBack: () => void;
  onLock: () => void;
  onAddItem: () => void;
};

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  vault,
  onBack,
  onLock,
  onAddItem,
}) => {
  // Using light theme with white background and black text
  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'delete_after_death':
        return 'Delete After Death';
      case 'share_after_death':
        return 'Share After Death';
      case 'handle_after_death':
        return 'Handle After Death';
      case 'sign_off_after_death':
        return 'Sign Off After Death';
      default:
        return 'Vault';
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.titleContainer}>
          <Text style={styles.title} numberOfLines={1}>
            {vault.name}
          </Text>
          <Text style={styles.category}>
            {getCategoryLabel(vault.category)}
          </Text>
        </View>
        
        <View style={styles.actions}>
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onBack}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="arrow-back" size={24} color="black" />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton} 
            onPress={onLock}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialIcons name="lock-outline" size={24} color="black" />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{vault.items.length}</Text>
          <Text style={styles.statLabel}>Items</Text>
        </View>
        
        <View style={styles.divider} />
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {vault.lastAccessedAt ? 'Active' : 'Never'}
          </Text>
          <Text style={styles.statLabel}>Last Accessed</Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.addButton}
        onPress={onAddItem}
      >
        <MaterialIcons name="add" size={24} color="white" />
        <Text style={styles.addButtonText}>Add Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    borderBottomWidth: 1,
    backgroundColor: 'white',
    borderBottomColor: '#e0e0e0',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flex: 1,
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 4,
    color: 'black',
  },
  category: {
    fontSize: 14,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'transparent',
    marginLeft: 8,
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  divider: {
    width: 1,
    backgroundColor: '#e0e0e0',
    marginHorizontal: 16,
  },
  addButton: {
    flexDirection: 'row',
    backgroundColor: 'black',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});
