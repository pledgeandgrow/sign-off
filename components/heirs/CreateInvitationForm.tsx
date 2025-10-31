import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import type { AccessLevelType } from '@/types/heir';

interface CreateInvitationFormProps {
  onSubmit: (data: {
    relationship?: string;
    access_level: AccessLevelType;
    notify_on_activation?: boolean;
    notification_delay_days?: number;
  }) => Promise<void>;
  onCancel: () => void;
}

const ACCESS_LEVELS: { value: AccessLevelType; label: string; description: string }[] = [
  {
    value: 'full',
    label: 'Accès Complet',
    description: 'Accès à tous les documents et informations',
  },
  {
    value: 'partial',
    label: 'Accès Partiel',
    description: 'Accès uniquement aux documents essentiels',
  },
  {
    value: 'view',
    label: 'Lecture Seule',
    description: 'Peut uniquement consulter les documents',
  },
];

const RELATIONSHIPS = [
  'Conjoint(e)',
  'Fils',
  'Fille',
  'Père',
  'Mère',
  'Frère',
  'Sœur',
  'Ami(e)',
  'Autre',
];

const NOTIFICATION_DELAYS = [
  { value: 0, label: 'Immédiatement' },
  { value: 7, label: '7 jours' },
  { value: 14, label: '14 jours' },
  { value: 30, label: '30 jours' },
];

export const CreateInvitationForm: React.FC<CreateInvitationFormProps> = ({
  onSubmit,
  onCancel,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'dark'];

  const [relationship, setRelationship] = useState<string>('');
  const [accessLevel, setAccessLevel] = useState<AccessLevelType>('full');
  const [notifyOnActivation, setNotifyOnActivation] = useState(true);
  const [notificationDelayDays, setNotificationDelayDays] = useState(7);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!accessLevel) {
      Alert.alert('Erreur', 'Veuillez sélectionner un niveau d\'accès');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({
        relationship: relationship || undefined,
        access_level: accessLevel,
        notify_on_activation: notifyOnActivation,
        notification_delay_days: notificationDelayDays,
      });
    } catch (error) {
      console.error('Error creating invitation:', error);
      Alert.alert('Erreur', 'Échec de la création de l\'invitation');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={onCancel} style={styles.headerButton}>
          <MaterialCommunityIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Inviter un Héritier
        </Text>
        <View style={styles.headerButton} />
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View style={[styles.infoBanner, { backgroundColor: colors.purple.primary + '20' }]}>
          <MaterialCommunityIcons
            name="information"
            size={20}
            color={colors.purple.primary}
          />
          <Text style={[styles.infoBannerText, { color: colors.text }]}>
            Un code unique sera généré pour inviter un utilisateur inscrit
          </Text>
        </View>

        {/* Relationship Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Relation (Optionnel)
          </Text>
          <View style={styles.relationshipGrid}>
            {RELATIONSHIPS.map((rel) => (
              <TouchableOpacity
                key={rel}
                style={[
                  styles.relationshipChip,
                  {
                    backgroundColor:
                      relationship === rel
                        ? colors.purple.primary
                        : colors.backgroundSecondary,
                    borderColor:
                      relationship === rel
                        ? colors.purple.primary
                        : colors.border,
                  },
                ]}
                onPress={() => setRelationship(rel)}
              >
                <Text
                  style={[
                    styles.relationshipChipText,
                    {
                      color: relationship === rel ? '#FFFFFF' : colors.text,
                    },
                  ]}
                >
                  {rel}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Access Level Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Niveau d'Accès *
          </Text>
          {ACCESS_LEVELS.map((level) => (
            <TouchableOpacity
              key={level.value}
              style={[
                styles.accessLevelCard,
                {
                  backgroundColor: colors.backgroundSecondary,
                  borderColor:
                    accessLevel === level.value
                      ? colors.purple.primary
                      : colors.border,
                  borderWidth: accessLevel === level.value ? 2 : 1,
                },
              ]}
              onPress={() => setAccessLevel(level.value)}
            >
              <View style={styles.accessLevelContent}>
                <View style={styles.accessLevelHeader}>
                  <MaterialCommunityIcons
                    name={
                      accessLevel === level.value
                        ? 'radiobox-marked'
                        : 'radiobox-blank'
                    }
                    size={24}
                    color={
                      accessLevel === level.value
                        ? colors.purple.primary
                        : colors.textSecondary
                    }
                  />
                  <Text style={[styles.accessLevelLabel, { color: colors.text }]}>
                    {level.label}
                  </Text>
                </View>
                <Text style={[styles.accessLevelDescription, { color: colors.textSecondary }]}>
                  {level.description}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notification Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.notificationToggle}
            onPress={() => setNotifyOnActivation(!notifyOnActivation)}
          >
            <View style={styles.notificationToggleLeft}>
              <MaterialCommunityIcons
                name="bell-outline"
                size={24}
                color={colors.text}
              />
              <View style={styles.notificationToggleText}>
                <Text style={[styles.notificationToggleTitle, { color: colors.text }]}>
                  Notification d'activation
                </Text>
                <Text style={[styles.notificationToggleSubtitle, { color: colors.textSecondary }]}>
                  Prévenir l'héritier lors de l'activation
                </Text>
              </View>
            </View>
            <View
              style={[
                styles.switch,
                {
                  backgroundColor: notifyOnActivation
                    ? colors.purple.primary
                    : colors.border,
                },
              ]}
            >
              <View
                style={[
                  styles.switchThumb,
                  {
                    transform: [{ translateX: notifyOnActivation ? 20 : 2 }],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>

          {notifyOnActivation && (
            <View style={styles.delaySection}>
              <Text style={[styles.delaySectionTitle, { color: colors.text }]}>
                Délai de notification
              </Text>
              <View style={styles.delayGrid}>
                {NOTIFICATION_DELAYS.map((delay) => (
                  <TouchableOpacity
                    key={delay.value}
                    style={[
                      styles.delayChip,
                      {
                        backgroundColor:
                          notificationDelayDays === delay.value
                            ? colors.purple.primary
                            : colors.backgroundSecondary,
                        borderColor:
                          notificationDelayDays === delay.value
                            ? colors.purple.primary
                            : colors.border,
                      },
                    ]}
                    onPress={() => setNotificationDelayDays(delay.value)}
                  >
                    <Text
                      style={[
                        styles.delayChipText,
                        {
                          color:
                            notificationDelayDays === delay.value
                              ? '#FFFFFF'
                              : colors.text,
                        },
                      ]}
                    >
                      {delay.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={[styles.footer, { borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            {
              backgroundColor: colors.purple.primary,
              opacity: loading ? 0.6 : 1,
            },
          ]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <MaterialCommunityIcons name="qrcode" size={20} color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Générer le Code d'Invitation</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  headerButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 20,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 20,
    marginBottom: 24,
  },
  infoBannerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  relationshipGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  relationshipChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  relationshipChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  accessLevelCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  accessLevelContent: {
    gap: 8,
  },
  accessLevelHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  accessLevelLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  accessLevelDescription: {
    fontSize: 14,
    marginLeft: 36,
  },
  notificationToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  notificationToggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  notificationToggleText: {
    flex: 1,
  },
  notificationToggleTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  notificationToggleSubtitle: {
    fontSize: 14,
  },
  switch: {
    width: 48,
    height: 28,
    borderRadius: 14,
    padding: 2,
    justifyContent: 'center',
  },
  switchThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  delaySection: {
    marginTop: 16,
    paddingLeft: 36,
  },
  delaySectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 12,
  },
  delayGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  delayChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
  },
  delayChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});
