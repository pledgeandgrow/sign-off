import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Vault } from '@/types/vault';

interface VaultHeaderProps {
  vault: Vault;
  onBack: () => void;
  onLock: () => void;
  onAddItem: () => void;
  onEdit?: () => void;
};

export const VaultHeader: React.FC<VaultHeaderProps> = ({
  vault,
  onBack,
  onLock,
  onAddItem,
  onEdit,
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
          <View style={styles.titleRow}>
            <Text style={styles.title} numberOfLines={1}>
              {vault.name}
            </Text>
          </View>
          <View style={styles.subtitleRow}>
            <Text style={styles.category}>
              {getCategoryLabel(vault.category)}
            </Text>
            <Text style={styles.lockStatus}>
              <MaterialIcons 
                name={vault.isLocked ? 'lock' : 'lock-open'} 
                size={14} 
                color={vault.isLocked ? '#666' : '#888'}
                style={styles.lockIcon}
              />
              {vault.isLocked ? ' Locked' : ' Unlocked'}
            </Text>
          </View>
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
            <MaterialIcons 
              name={vault.isLocked ? 'lock' : 'lock-open'} 
              size={24} 
              color="#000" 
            />
          </TouchableOpacity>
          
          {onEdit && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={onEdit}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <MaterialIcons name="edit" size={24} color="#000" />
            </TouchableOpacity>
          )}
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
    marginRight: 12,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
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
  lockStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  lockIcon: {
    marginRight: 4,
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
