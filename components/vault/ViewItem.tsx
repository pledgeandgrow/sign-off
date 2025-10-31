import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, Alert, ScrollView } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { VaultItem, VaultItemType } from '@/types/vault';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

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

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const ViewItem: React.FC<{ 
  item: VaultItem; 
  onEdit: () => void;
  onDelete?: () => void;
  onBack?: () => void;
}> = ({ item, onEdit, onDelete, onBack }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [showPassword, setShowPassword] = useState(true); // Show by default
  const iconName = itemIcons[item.type] || 'dots-horizontal';
  const styles = createStyles();

  const handleDelete = () => {
    // Call parent's onDelete which handles confirmation
    onDelete?.();
  };

  const renderMetadata = () => {
    const { metadata, type } = item;
    
    switch (type) {
      case 'password':
        return (
          <View style={styles.metadataSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails</Text>
            <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nom d'utilisateur</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>{(metadata as any).username || 'Non défini'}</Text>
            </View>
            
            <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <View style={styles.fieldHeader}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Mot de passe</Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={colors.purple.primary} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldValue, { color: '#FFFFFF' }]}>
                {showPassword ? ((metadata as any).password || 'Aucun mot de passe') : '••••••••••••'}
              </Text>
            </View>
            
            {(metadata as any).url && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>URL</Text>
                <Text style={[styles.fieldValue, styles.link, { color: colors.purple.primary }]} numberOfLines={1}>
                  {(metadata as any).url}
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'crypto':
        return (
          <View style={styles.metadataSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Détails Crypto</Text>
            <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Adresse du portefeuille</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]} numberOfLines={1}>
                {(metadata as any).walletAddress || 'Non défini'}
              </Text>
            </View>
            
            <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <View style={styles.fieldHeader}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Clé privée</Text>
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <MaterialCommunityIcons 
                    name={showPassword ? 'eye-off' : 'eye'} 
                    size={20} 
                    color={colors.purple.primary} 
                  />
                </TouchableOpacity>
              </View>
              <Text style={[styles.fieldValue, { color: '#FFFFFF' }]}>
                {showPassword ? ((metadata as any).privateKey || 'Aucune clé') : '••••••••••••'}
              </Text>
            </View>
            
            {(metadata as any).network && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Réseau</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).network}
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'bank':
        return (
          <View style={styles.metadataSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations bancaires</Text>
            <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Numéro de compte</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {(metadata as any).accountNumber || 'Non défini'}
              </Text>
            </View>
            
            {(metadata as any).routingNumber && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Code banque / IBAN</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).routingNumber}
                </Text>
              </View>
            )}
            
            {(metadata as any).accountType && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Type de compte</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).accountType}
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'document':
      case 'image':
      case 'video':
        return (
          <View style={styles.metadataSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations du fichier</Text>
            
            {/* File Preview */}
            {(metadata as any).fileUrl && (
              <View style={[styles.previewCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                {type === 'image' && (
                  <img 
                    src={(metadata as any).fileUrl} 
                    alt={(metadata as any).fileName}
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      objectFit: 'contain',
                      borderRadius: '8px'
                    }}
                  />
                )}
                
                {type === 'video' && (
                  <video 
                    src={(metadata as any).fileUrl}
                    controls
                    style={{
                      width: '100%',
                      maxHeight: '300px',
                      borderRadius: '8px'
                    }}
                  />
                )}
                
                {type === 'document' && (
                  <View style={styles.documentPreview}>
                    <MaterialCommunityIcons name="file-document" size={64} color={colors.purple.primary} />
                    <Text style={[styles.documentPreviewText, { color: colors.textSecondary }]}>
                      Aperçu non disponible pour ce type de fichier
                    </Text>
                  </View>
                )}
                
                {/* Download Button */}
                <TouchableOpacity
                  style={[styles.downloadButton, { backgroundColor: colors.purple.primary }]}
                  onPress={() => {
                    const link = document.createElement('a');
                    link.href = (metadata as any).fileUrl;
                    link.download = (metadata as any).fileName || 'download';
                    link.target = '_blank';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                  }}
                  activeOpacity={0.8}
                >
                  <MaterialCommunityIcons name="download" size={20} color="#FFFFFF" />
                  <Text style={styles.downloadButtonText}>Télécharger</Text>
                </TouchableOpacity>
              </View>
            )}
            
            <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Nom du fichier</Text>
              <Text style={[styles.fieldValue, { color: colors.text }]}>
                {(metadata as any).fileName || 'Non défini'}
              </Text>
            </View>
            
            {(metadata as any).fileSize && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Taille</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).fileSize}
                </Text>
              </View>
            )}
            
            {(metadata as any).description && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Description</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).description}
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'other':
        return (
          <View style={styles.metadataSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Informations</Text>
            {(metadata as any).field1 && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Champ 1</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).field1}
                </Text>
              </View>
            )}
            
            {(metadata as any).field2 && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Champ 2</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).field2}
                </Text>
              </View>
            )}
            
            {(metadata as any).notes && (
              <View style={[styles.fieldCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
                <Text style={[styles.fieldLabel, { color: colors.textSecondary }]}>Notes</Text>
                <Text style={[styles.fieldValue, { color: colors.text }]}>
                  {(metadata as any).notes}
                </Text>
              </View>
            )}
          </View>
        );
        
      case 'note':
        return (
          <View style={styles.metadataSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Contenu</Text>
            <View style={[styles.noteCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
              <Text style={[styles.noteText, { color: colors.text }]}>
                {(metadata as any).content || 'Aucun contenu'}
              </Text>
            </View>
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
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={[styles.backButton, { backgroundColor: 'rgba(255, 255, 255, 0.05)' }]}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <View style={[styles.typeBadge, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <Text style={[styles.typeBadgeText, { color: colors.purple.primary }]}>
              {itemTypeLabels[item.type]}
            </Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={onEdit} style={[styles.actionButton, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
            <MaterialCommunityIcons name="pencil" size={20} color={colors.purple.primary} />
          </TouchableOpacity>
          {onDelete && (
            <TouchableOpacity onPress={handleDelete} style={[styles.actionButton, { backgroundColor: 'rgba(239, 68, 68, 0.2)' }]}>
              <MaterialCommunityIcons name="delete" size={20} color="#EF4444" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={[styles.divider, { backgroundColor: 'rgba(255, 255, 255, 0.1)' }]} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
      >
        <View style={styles.detailsContainer}>
        <View style={[styles.infoCard, { backgroundColor: 'rgba(255, 255, 255, 0.05)', borderColor: 'rgba(255, 255, 255, 0.1)' }]}>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="calendar" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Créé le</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.infoRow}>
            <MaterialCommunityIcons name="update" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>Modifié le</Text>
            <Text style={[styles.infoValue, { color: colors.text }]}>{formatDate(item.updatedAt)}</Text>
          </View>
          {item.isEncrypted && (
            <View style={styles.infoRow}>
              <MaterialCommunityIcons name="lock" size={16} color={colors.purple.primary} />
              <Text style={[styles.infoLabel, { color: colors.purple.primary }]}>Chiffré</Text>
            </View>
          )}
        </View>
        
        {item.tags && item.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagsContainer}>
              {item.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: 'rgba(139, 92, 246, 0.2)' }]}>
                  <Text style={[styles.tagText, { color: colors.purple.primary }]}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {renderMetadata()}
        </View>
      </ScrollView>
    </View>
  );
};

const createStyles = () => StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 6,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 16,
  },
  detailsContainer: {
    gap: 20,
  },
  infoCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  metadataSection: {
    gap: 12,
  },
  fieldCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
  },
  fieldHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 8,
  },
  fieldValue: {
    fontSize: 15,
    fontWeight: '400',
  },
  link: {
    textDecorationLine: 'underline',
  },
  noteCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minHeight: 100,
  },
  noteText: {
    fontSize: 15,
    lineHeight: 24,
  },
  tagsSection: {
    gap: 12,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
  },
  previewCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    gap: 12,
  },
  documentPreview: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  documentPreviewText: {
    fontSize: 14,
    textAlign: 'center',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
    shadowColor: '#8B5CF6',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
