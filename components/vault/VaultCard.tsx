import { useTheme } from '@/contexts/ThemeContext';
import { Vault, VaultCategory } from '@/types/vault';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

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

const VaultCard: React.FC<VaultCardProps> = ({ vault, onPress, isSelected = false }) => {
  const { colors: themeColors } = useTheme();
  
  // Use consistent colors matching the heirs page design
  const colors = {
    card: '#ffffff',
    primary: '#000000',
    border: '#f0f0f0',
    text: '#000000',
    textSecondary: '#666666',
  };
  
  const itemCount = vault.items?.length || 0;
  const iconName = vault.icon || categoryIcons[vault.category] || 'lock';
  const label = vault.name || categoryLabels[vault.category] || 'Vault';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: colors.card,
          borderColor: isSelected ? colors.primary : colors.border,
          borderWidth: 1,
          borderRadius: 8,
          marginBottom: 8,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <MaterialIcons 
          name={iconName as any} 
          size={20} 
          color={isSelected ? colors.primary : colors.text}
        />
      </View>
      <View style={styles.content}>
        <Text 
          style={[
            styles.title, 
            { 
              color: colors.text,
              fontWeight: '500',
              fontSize: 16,
            }
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={[styles.itemCount, { color: colors.textSecondary, fontSize: 14 }]}>
          {itemCount} {itemCount === 1 ? 'item' : 'items'}
        </Text>
      </View>
      <MaterialIcons 
        name="chevron-right" 
        size={20} 
        color={colors.textSecondary}
        style={styles.chevron}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#f0f0f0',
    width: '100%',
  },
  iconContainer: {
    marginRight: 16,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 2,
  },
  itemCount: {
    fontSize: 14,
  },
  chevron: {
    marginLeft: 8,
  },
});

export { VaultCard };
export default VaultCard;
