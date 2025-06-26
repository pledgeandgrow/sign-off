import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { VaultItem, VaultItemType } from '@/types/vault';
import { Text } from '../ui/Text';
import { useTheme } from '@/contexts/ThemeContext';

const itemIcons: Record<VaultItemType, keyof typeof MaterialIcons.glyphMap> = {
  password: 'vpn-key',
  document: 'description',
  video: 'videocam',
  image: 'image',
  note: 'sticky-note-2',
  crypto: 'currency-bitcoin',
  bank: 'account-balance',
  other: 'more-horiz',
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ViewItem: React.FC<{ item: VaultItem; onEdit: () => void }> = ({ item, onEdit }) => {
  const { theme } = useTheme();
  const iconName = itemIcons[item.type] || 'more-horiz' as const;
  const styles = createStyles(theme);

  const renderMetadata = () => {
    const { metadata, type } = item;
    
    switch (type) {
      case 'password':
        return (
          <View style={styles.metadataSection}>
            <Text style={styles.label}>Username:</Text>
            <Text style={styles.value}>{(metadata as any).username || 'Not set'}</Text>
            
            <Text style={styles.label}>Password:</Text>
            <Text style={styles.value}>••••••••</Text>
            
            {(metadata as any).url && (
              <>
                <Text style={styles.label}>URL:</Text>
                <Text style={[styles.value, styles.link]} numberOfLines={1} ellipsizeMode="tail">
                  {(metadata as any).url}
                </Text>
              </>
            )}
          </View>
        );
        
      case 'document':
      case 'image':
      case 'video':
        return (
          <View style={styles.metadataSection}>
            <Text style={styles.label}>File Name:</Text>
            <Text style={styles.value}>{(metadata as any).fileName || 'No file name'}</Text>
            
            {(metadata as any).fileSize && (
              <>
                <Text style={styles.label}>File Size:</Text>
                <Text style={styles.value}>{(metadata as any).fileSize} bytes</Text>
              </>
            )}
            
            {(metadata as any).fileType && (
              <>
                <Text style={styles.label}>File Type:</Text>
                <Text style={styles.value}>{(metadata as any).fileType}</Text>
              </>
            )}
          </View>
        );
        
      case 'note':
        return (
          <View style={styles.metadataSection}>
            <Text style={styles.label}>Note:</Text>
            <Text style={[styles.value, styles.noteText]}>
              {(metadata as any).content || 'No content'}
            </Text>
          </View>
        );
        
      default:
        return (
          <View style={styles.metadataSection}>
            {Object.entries(metadata).map(([key, value]) => (
              <View key={key}>
                <Text style={styles.label}>{key}:</Text>
                <Text style={styles.value}>
                  {typeof value === 'string' ? value : JSON.stringify(value)}
                </Text>
              </View>
            ))}
          </View>
        );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.card }]}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.iconContainer}>
            <MaterialIcons name={iconName} size={24} color={theme.colors.primary} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text }]}>{item.title}</Text>
        </View>
        <TouchableOpacity onPress={onEdit} style={styles.editButton}>
          <MaterialIcons name="edit" size={20} color={theme.colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.divider} />
      
      <View style={styles.detailsContainer}>
        <View style={styles.detailRow}>
          <Text style={styles.label}>Type:</Text>
          <Text style={styles.value}>
            {item.type.charAt(0).toUpperCase() + item.type.slice(1)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Created:</Text>
          <Text style={styles.value}>{formatDate(item.createdAt)}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={styles.label}>Last Updated:</Text>
          <Text style={styles.value}>{formatDate(item.updatedAt)}</Text>
        </View>
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.detailRow}>
            <Text style={styles.label}>Tags:</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: theme.colors.background }]}>
                  <Text style={[styles.tagText, { color: theme.colors.text }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {renderMetadata()}
      </View>
    </View>
  );
};

const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
  },
  editButton: {
    padding: 8,
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginVertical: 16,
  },
  detailsContainer: {
    marginTop: 8,
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  label: {
    width: 100,
    fontSize: 14,
    color: '#666666',
    marginRight: 8,
    fontWeight: '500',
  },
  value: {
    flex: 1,
    fontSize: 14,
    color: '#000000',
    textAlign: 'right',
  },
  metadataSection: {
    marginTop: 8,
    gap: 12,
  },
  link: {
    color: '#0066cc',
    textDecorationLine: 'underline',
  },
  noteText: {
    fontSize: 14,
    color: '#000000',
    lineHeight: 22,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 6,
  },
  tag: {
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    fontSize: 12,
    color: '#333333',
  },
});
