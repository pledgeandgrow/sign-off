import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VaultItem, VaultItemType } from '@/types/vault';


type VaultItemCardProps = {
  item: VaultItem;
  onPress: () => void;
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
  isSelected = false,
}) => {
  const iconName = itemIcons[item.type] || 'more-horiz';
  // Using light theme with white background and black text
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        isSelected && styles.selectedContainer,
      ]}
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.7}
    >
      <View style={[
        styles.iconContainer,
        isSelected && styles.selectedIconContainer,
      ]}>
        <MaterialIcons 
          name={iconName as any} 
          size={20} 
          color={isSelected ? 'white' : 'black'} 
        />
      </View>
      
      <View style={styles.content}>
        <Text 
          style={[
            styles.title,
            isSelected && styles.selectedText,
          ]} 
          numberOfLines={1} 
          ellipsizeMode="tail"
        >
          {item.title}
        </Text>
        <Text 
          style={[
            styles.subtitle,
            isSelected && styles.selectedSubtext,
          ]} 
          numberOfLines={1}
        >
          {getItemSubtitle(item)}
        </Text>
      </View>
      
      {item.isEncrypted && (
        <View style={styles.actions}>
          <MaterialIcons name="lock" size={16} color="rgba(0, 0, 0, 0.5)" />
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
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  selectedContainer: {
    backgroundColor: '#f5f5f5',
    borderColor: 'black',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  selectedIconContainer: {
    backgroundColor: 'black',
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '500',
    color: 'black',
    marginBottom: 2,
  },
  selectedText: {
    color: 'black',
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 13,
    color: 'rgba(0, 0, 0, 0.7)',
  },
  selectedSubtext: {
    color: 'rgba(0, 0, 0, 0.9)',
  },
  actions: {
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
});
