import { Vault, VaultCategory } from '@/types/vault';
import { MaterialIcons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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
  delete_after_death: 'Supprimer après la mort',
  share_after_death: 'Partager après la mort',
  handle_after_death: 'Gérer après la mort',
  sign_off_after_death: 'Sign-off après la mort',
};

const VaultCard: React.FC<VaultCardProps> = ({ vault, onPress, isSelected = false }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  
  const itemCount = vault.items?.length || 0;
  const iconName = vault.icon || categoryIcons[vault.category] || 'lock';
  const label = vault.name || categoryLabels[vault.category] || 'Coffre-fort';

  return (
    <TouchableOpacity 
      style={[
        styles.container, 
        { 
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: isSelected ? colors.purple.primary : 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
        <MaterialIcons 
          name={iconName as any} 
          size={20} 
          color={colors.purple.primary}
        />
      </View>
      <View style={styles.content}>
        <Text 
          style={[
            styles.title, 
            { 
              color: colors.text,
              fontWeight: '600',
              fontSize: 16,
            }
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
        <Text style={[styles.itemCount, { color: colors.textSecondary, fontSize: 14 }]}>
          {itemCount} {itemCount === 1 ? 'élément' : 'éléments'}
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
    borderWidth: 1,
    width: '100%',
  },
  iconContainer: {
    marginRight: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
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
