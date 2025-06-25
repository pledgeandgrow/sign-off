import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Vault, VaultCategory } from '@/types/vault';


type VaultCardProps = {
  vault: Vault;
  onPress: () => void;
  isSelected?: boolean;
};

const categoryIcons: Record<VaultCategory, string> = {
  delete_after_death: 'delete-forever',
  share_after_death: 'share',
  handle_after_death: 'account-check',
  sign_off_after_death: 'security',
};

const categoryLabels: Record<VaultCategory, string> = {
  delete_after_death: 'Delete After Death',
  share_after_death: 'Share After Death',
  handle_after_death: 'Handle After Death',
  sign_off_after_death: 'Sign Off After Death',
};

export const VaultCard: React.FC<VaultCardProps> = ({ vault, onPress, isSelected = false }) => {
  // Using light theme with white background and black text
  const itemCount = vault.items.length;
  const iconName = vault.icon || categoryIcons[vault.category] || 'lock';
  
  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        isSelected && styles.selectedContainer
      ]} 
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name={iconName as any} 
          size={24} 
          color="black"
        />
      </View>
      
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {vault.name}
        </Text>
        <Text style={styles.category}>
          {categoryLabels[vault.category] || 'Vault'}
        </Text>
        <Text style={styles.itemCount}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>
      
      <View style={styles.statusContainer}>
        {vault.isLocked && (
          <MaterialIcons 
            name="lock" 
            size={20} 
            color="rgba(0, 0, 0, 0.5)"
            style={styles.lockIcon} 
          />
        )}
        <MaterialIcons 
          name="chevron-right" 
          size={24} 
          color="rgba(0, 0, 0, 0.5)"
        />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    backgroundColor: 'white',
    borderColor: '#e0e0e0',
  },
  selectedContainer: {
    borderWidth: 1,
    borderColor: 'black',
    backgroundColor: '#f5f5f5',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
    color: 'black',
  },
  category: {
    fontSize: 13,
    marginBottom: 2,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  itemCount: {
    fontSize: 12,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  lockIcon: {
    marginRight: 8,
  },
});
