import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VaultItem, VaultItemType } from '@/types/vault';
import { MaterialIcons as Icons } from '@expo/vector-icons';
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
  password: 'key',
  document: 'description',
  video: 'videocam',
  image: 'image',
  note: 'note',
  crypto: 'currency-btc',
  bank: 'account-balance',
  other: 'more-horiz',
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
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          borderColor: isSelected ? colors.purple.primary : 'rgba(255, 255, 255, 0.1)',
          borderWidth: 1,
        }
      ]} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
        <Icons 
          name={iconName as keyof typeof Icons.glyphMap} 
          size={20} 
          color={colors.purple.primary}
        />
      </View>
      
      <View style={styles.content}>
        <Text 
          style={[styles.title, { color: colors.text }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text 
          style={[styles.subtitle, { color: colors.textSecondary }]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {getItemSubtitle(item)}
        </Text>
      </View>
      
      {item.isEncrypted && (
        <View style={styles.actions}>
          <Icons name="lock" size={16} color={colors.purple.primary} />
        </View>
      )}
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
    marginBottom: 12,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
  },
  actions: {
    marginLeft: 8,
    padding: 4,
  },
});
