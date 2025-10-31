import { Vault, VaultCategory } from '@/types/vault';
import { MaterialCommunityIcons } from '@expo/vector-icons';
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
  delete_after_death: 'delete',
  share_after_death: 'share-variant',
  handle_after_death: 'account-check',
  sign_off_after_death: 'shield-lock',
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
          backgroundColor: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'rgba(255, 255, 255, 0.05)',
          borderColor: isSelected ? colors.purple.primary : 'rgba(255, 255, 255, 0.1)',
        }
      ]}
      onPress={onPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: vault.color || colors.purple.primary }]}>
        <MaterialCommunityIcons 
          name={iconName as any} 
          size={24} 
          color="#FFFFFF"
        />
      </View>
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text 
            style={[
              styles.title, 
              { color: colors.text }
            ]}
            numberOfLines={1}
          >
            {label}
          </Text>
          {vault.isEncrypted && (
            <View style={[styles.encryptedBadge, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
              <MaterialCommunityIcons name="lock" size={12} color="#10B981" />
            </View>
          )}
        </View>
        <View style={styles.metaRow}>
          <MaterialCommunityIcons name="file-document" size={14} color={colors.textSecondary} />
          <Text style={[styles.itemCount, { color: colors.textSecondary }]}>
            {itemCount} {itemCount === 1 ? 'élément' : 'éléments'}
          </Text>
        </View>
      </View>
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={24} 
        color={colors.textTertiary}
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
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  encryptedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemCount: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export { VaultCard };
export default VaultCard;
