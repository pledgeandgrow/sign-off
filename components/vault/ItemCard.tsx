import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VaultItem, VaultItemType } from '@/types/vault';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';


type VaultItemCardProps = {
  item: VaultItem;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  onLongPress?: () => void;
  isSelected?: boolean;
};

const itemIcons: Record<VaultItemType, string> = {
  password: 'key-variant',
  document: 'file-document',
  video: 'video',
  image: 'image',
  note: 'note-text',
  crypto: 'bitcoin',
  bank: 'bank',
  other: 'dots-horizontal',
};

const itemTypeLabels: Record<VaultItemType, string> = {
  password: 'Mot de passe',
  document: 'Document',
  video: 'Vidéo',
  image: 'Image',
  note: 'Note',
  crypto: 'Crypto',
  bank: 'Banque',
  other: 'Autre',
};

export const VaultItemCard: React.FC<VaultItemCardProps> = ({ 
  item, 
  onPress, 
  onLongPress,
  onEdit,
  onDelete,
  isSelected = false,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const iconName = itemIcons[item.type] || 'more-horiz';
  
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
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
        <MaterialCommunityIcons 
          name={iconName as any} 
          size={20} 
          color={colors.purple.primary}
        />
      </View>
      
      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text 
            style={[styles.title, { color: colors.text }]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {item.title}
          </Text>
          {item.isEncrypted && (
            <MaterialCommunityIcons name="lock" size={16} color={colors.purple.primary} />
          )}
        </View>
        <View style={styles.metaRow}>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <Text style={[styles.typeText, { color: colors.purple.primary }]}>
              {itemTypeLabels[item.type]}
            </Text>
          </View>
          <Text 
            style={[styles.subtitle, { color: colors.textSecondary }]} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          >
            {getItemSubtitle(item)}
          </Text>
        </View>
      </View>
      
      <MaterialCommunityIcons 
        name="chevron-right" 
        size={20} 
        color={colors.textTertiary}
      />
    </TouchableOpacity>
  );
};

function getItemSubtitle(item: VaultItem): string {
  const metadata = item.metadata as any;
  
  switch (item.type) {
    case 'password':
      return metadata.username || 'Password';
    case 'document':
      return metadata.fileName || 'Document';
    case 'video':
      return metadata.fileName || 'Video';
    case 'image':
      return metadata.fileName || 'Image';
    case 'note':
      return metadata.content ? 
        (metadata.content.length > 30 ? `${metadata.content.substring(0, 30)}...` : metadata.content) : 
        'Note';
    case 'crypto':
      return metadata.walletAddress ? 
        `${metadata.walletAddress.substring(0, 6)}...${metadata.walletAddress.slice(-4)}` : 
        'Cryptocurrency';
    case 'bank':
      return metadata.accountNumber ? 
        `•••• ${metadata.accountNumber.slice(-4)}` : 
        'Bank Account';
    default:
      return 'Item';
  }
}

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
    width: 40,
    height: 40,
    borderRadius: 20,
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
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  typeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
});
