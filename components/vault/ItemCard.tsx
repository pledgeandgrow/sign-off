import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { VaultItem, VaultItemType } from '@/types/vault';
import { useTheme } from '@/contexts/ThemeContext';
import { MaterialIcons as Icons } from '@expo/vector-icons';


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
  useTheme(); // Theme context might be used by child components
  const iconName = itemIcons[item.type] || 'more-horiz';
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { 
          backgroundColor: '#ffffff',
          borderColor: isSelected ? '#000000' : '#f0f0f0',
          borderWidth: 1,
          borderRadius: 8,
          marginBottom: 8,
        }
      ]} 
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.8}
    >
      <View style={styles.iconContainer}>
        <Icons 
          name={iconName as keyof typeof Icons.glyphMap} 
          size={20} 
          color={isSelected ? '#000000' : '#666666'}
        />
      </View>
      
      <View style={styles.content}>
        <Text 
          style={styles.title} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text 
          style={styles.subtitle} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {getItemSubtitle(item)}
        </Text>
      </View>
      
      {item.isEncrypted && (
        <View style={styles.actions}>
          <Icons name="lock" size={16} color="#666666" />
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
    marginHorizontal: 16,
    marginBottom: 8,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666666',
  },
  actions: {
    marginLeft: 8,
    padding: 4,
  },
});
