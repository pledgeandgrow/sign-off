import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Share,
  Alert,
  Clipboard,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface InvitationCodeDisplayProps {
  invitationCode: string;
  expiresAt: string;
  onClose: () => void;
}

export const InvitationCodeDisplay: React.FC<InvitationCodeDisplayProps> = ({
  invitationCode,
  expiresAt,
  onClose,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    Clipboard.setString(invitationCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    Alert.alert('Copié !', 'Le code a été copié dans le presse-papiers');
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Rejoignez-moi comme héritier sur Sign-off !\n\nCode d'invitation : ${invitationCode}\n\nTéléchargez l'application et utilisez ce code pour accepter l'invitation.`,
        title: 'Invitation Sign-off',
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  const formatExpiryDate = (date: string) => {
    const expiry = new Date(date);
    const now = new Date();
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays <= 0) return 'Expiré';
    if (diffDays === 1) return 'Expire dans 1 jour';
    return `Expire dans ${diffDays} jours`;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: colors.purple.primary + '20' }]}>
            <MaterialCommunityIcons name="qrcode" size={24} color={colors.purple.primary} />
          </View>
          <View>
            <Text style={[styles.title, { color: colors.text }]}>
              Code d'invitation
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {formatExpiryDate(expiresAt)}
            </Text>
          </View>
        </View>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.textSecondary} />
        </TouchableOpacity>
      </View>

      {/* QR Code */}
      <View style={[styles.qrContainer, { backgroundColor: colors.surface }]}>
        <View style={styles.qrWrapper}>
          <QRCode
            value={invitationCode}
            size={200}
            backgroundColor="white"
            color="black"
          />
        </View>
      </View>

      {/* Code */}
      <View style={[styles.codeContainer, { backgroundColor: colors.surface }]}>
        <Text style={[styles.codeLabel, { color: colors.textSecondary }]}>
          Code d'invitation
        </Text>
        <TouchableOpacity
          style={styles.codeRow}
          onPress={handleCopyCode}
          activeOpacity={0.7}
        >
          <Text style={[styles.code, { color: colors.text }]}>
            {invitationCode}
          </Text>
          <MaterialCommunityIcons
            name={copied ? 'check' : 'content-copy'}
            size={20}
            color={copied ? colors.success : colors.purple.primary}
          />
        </TouchableOpacity>
      </View>

      {/* Instructions */}
      <View style={styles.instructions}>
        <Text style={[styles.instructionsTitle, { color: colors.text }]}>
          Comment utiliser ce code ?
        </Text>
        <View style={styles.instructionsList}>
          <View style={styles.instructionItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.purple.primary }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Partagez ce code avec la personne que vous souhaitez désigner comme héritier
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.purple.primary }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Elle devra scanner le QR code ou saisir le code manuellement dans l'application
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.purple.primary }]}>
              <Text style={styles.stepNumberText}>3</Text>
            </View>
            <Text style={[styles.instructionText, { color: colors.textSecondary }]}>
              Une fois accepté, elle apparaîtra dans votre liste d'héritiers
            </Text>
          </View>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.shareButton, { backgroundColor: colors.purple.primary }]}
          onPress={handleShare}
          activeOpacity={0.8}
        >
          <MaterialCommunityIcons name="share-variant" size={20} color="#FFFFFF" />
          <Text style={styles.shareButtonText}>Partager</Text>
        </TouchableOpacity>
      </View>

      {/* Warning */}
      <View style={[styles.warning, { backgroundColor: colors.warning + '20' }]}>
        <MaterialCommunityIcons name="alert-circle" size={16} color={colors.warning} />
        <Text style={[styles.warningText, { color: colors.warning }]}>
          Ce code expire dans 7 jours. Ne le partagez qu'avec des personnes de confiance.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  qrContainer: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  qrWrapper: {
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 12,
  },
  codeContainer: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  codeLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  code: {
    fontSize: 24,
    fontWeight: '700',
    letterSpacing: 2,
  },
  instructions: {
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 16,
  },
  instructionsList: {
    gap: 16,
  },
  instructionItem: {
    flexDirection: 'row',
    gap: 12,
  },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  instructionText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  actions: {
    marginBottom: 16,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  shareButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  warning: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 16,
  },
});
