import { Colors } from '@/constants/Colors';
import { useAuth } from '@/contexts/AuthContext';
import { useHeirs } from '@/contexts/HeirContext';
import { useVault } from '@/contexts/VaultContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Activity, formatActivityTime, getActivityIcon, getRecentActivities } from '@/lib/services/activityService';
import { getInheritancePlans } from '@/lib/services/inheritanceService';
import { getUserSubscription } from '@/lib/services/subscriptionService';
import { SQUARE_CONFIG } from '@/lib/constants';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  Alert,
  Dimensions,
  Linking,
  RefreshControl,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');

const QUICK_ACTIONS = [
  {
    id: '1',
    title: 'Créer un coffre-fort',
    description: 'Stockez vos mots de passe et documents',
    icon: 'lock-plus',
    route: '/vaults',
    color: Colors.dark.purple.primary,
  },
  {
    id: '2',
    title: 'Ajouter un héritier',
    description: 'Choisissez qui hérite de vos données',
    icon: 'account-plus',
    route: '/heirs',
    color: Colors.dark.purple.secondary,
  },
  {
    id: '3',
    title: 'Accéder a votre profil',
    description: 'Gérez vos informations personnelles',
    icon: 'account-circle',
    route: '/profile',
    color: Colors.dark.purple.tertiary,
  },
];

export default function HomeScreen() {
  const [refreshing, setRefreshing] = useState(false);
  const [inheritancePlansCount, setInheritancePlansCount] = useState(0);
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [subscriptionStatus, setSubscriptionStatus] = useState<string>('free');
  const colorScheme = useColorScheme();
  const router = useRouter();
  const colors = Colors[colorScheme ?? 'dark'];
  const { user } = useAuth();
  const { vaults } = useVault();
  const { heirs } = useHeirs();

  // Calculate real stats
  const vaultsCount = vaults.length;
  const heirsCount = heirs.length;
  const totalItems = vaults.reduce((sum, vault) => sum + (vault.items?.length || 0), 0);

  // Fetch data
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    await Promise.all([
      loadInheritancePlans(),
      loadActivities(),
      loadSubscriptionStatus(),
    ]);
  };

  const loadSubscriptionStatus = async () => {
    if (!user) return;
    try {
      const subscription = await getUserSubscription(user.id);
      if (subscription) {
        setIsPremium(
          subscription.subscription_tier === 'premium' && 
          subscription.subscription_status === 'active'
        );
        setSubscriptionStatus(subscription.subscription_tier);
      }
    } catch (error) {
      console.error('Error loading subscription:', error);
    }
  };

  const handleUpgrade = async () => {
    if (!user) {
      Alert.alert('Erreur', 'Veuillez vous connecter d\'abord');
      return;
    }

    try {
      const paymentUrl = `${SQUARE_CONFIG.PAYMENT_LINK}?user_id=${user.id}`;
      const canOpen = await Linking.canOpenURL(paymentUrl);
      
      if (canOpen) {
        await Linking.openURL(paymentUrl);
      } else {
        Alert.alert('Erreur', 'Impossible d\'ouvrir le lien de paiement');
      }
    } catch (error) {
      console.error('Error opening payment link:', error);
      Alert.alert('Erreur', 'Échec de l\'ouverture de la page de paiement');
    }
  };

  const loadInheritancePlans = async () => {
    if (!user) return;
    try {
      const plans = await getInheritancePlans(user.id);
      setInheritancePlansCount(plans.length);
    } catch (error) {
      console.error('Error loading inheritance plans:', error);
    }
  };

  const loadActivities = async () => {
    if (!user) return;
    try {
      const activities = await getRecentActivities(user.id, 5);
      setRecentActivities(activities);
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    loadData();
    setTimeout(() => setRefreshing(false), 1000);
  }, [user]);

  // Real stats data
  const STATS_DATA = [
    { label: 'Coffres-forts', value: vaultsCount.toString(), icon: 'lock' },
    { label: 'Héritiers', value: heirsCount.toString(), icon: 'account-group' },
    { label: 'Plans d\'héritage', value: inheritancePlansCount.toString(), icon: 'file-document-multiple' },
  ];

  const QuickActionCard = ({ item }: { item: typeof QUICK_ACTIONS[0] }) => (
    <TouchableOpacity
      style={styles.quickActionCard}
      onPress={() => router.push(item.route as any)}
      activeOpacity={0.8}
    >
      <View style={[styles.iconContainer, { backgroundColor: item.color + '20' }]}>
        <MaterialCommunityIcons name={item.icon as any} size={24} color={item.color} />
      </View>
      <View style={styles.quickActionContent}>
        <Text style={styles.quickActionTitle}>{item.title}</Text>
        <Text style={styles.quickActionDescription}>{item.description}</Text>
      </View>
      <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
    </TouchableOpacity>
  );

  const StatCard = ({ stat }: { stat: typeof STATS_DATA[0] }) => (
    <View style={styles.statCard}>
      <View style={styles.statIconContainer}>
        <MaterialCommunityIcons name={stat.icon as any} size={20} color={colors.purple.primary} />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  const ActivityItem = ({ activity }: { activity: Activity }) => (
    <View style={styles.activityItem}>
      <View style={styles.activityIconContainer}>
        <MaterialCommunityIcons 
          name={getActivityIcon(activity.activity_type) as any} 
          size={16} 
          color={colors.purple.primary} 
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{activity.title}</Text>
        <Text style={styles.activityTime}>{formatActivityTime(activity.created_at)}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaViewRN style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <StatusBar barStyle="light-content" backgroundColor={colors.background} />
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl 
            refreshing={refreshing} 
            onRefresh={onRefresh}
            tintColor={colors.purple.primary}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Stats Overview */}
        <View style={styles.statsContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Vue d'ensemble
          </Text>
          <View style={styles.statsGrid}>
            {STATS_DATA.map((stat, index) => (
              <StatCard key={index} stat={stat} />
            ))}
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Actions rapides
          </Text>
          {QUICK_ACTIONS.map((action) => (
            <QuickActionCard key={action.id} item={action} />
          ))}
        </View>

        {/* Pricing Plans */}
        <View style={styles.pricingSection}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            snapToInterval={width - 60}
            decelerationRate="fast"
            contentContainerStyle={styles.plansSlider}
          >
            {/* Free Plan */}
            <View style={[styles.planCard, { backgroundColor: 'rgba(139, 92, 246, 0.1)', borderColor: 'rgba(139, 92, 246, 0.2)', width: width - 60 }]}>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: colors.text }]}>Classic</Text>
                  <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                    Gestion essentielle de l'héritage numérique
                  </Text>
                </View>
                <View style={styles.planBadge}>
                  <Text style={styles.planBadgeText}>GRATUIT</Text>
                </View>
              </View>

              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>3 coffres-forts gratuits</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>3 héritiers gratuits</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Stockage jusqu'à 1 Go</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Sécurité de base</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Support par email</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.planButton, { backgroundColor: 'transparent', borderColor: colors.purple.primary, borderWidth: 2 }]}
                activeOpacity={0.8}
                disabled={!isPremium}
              >
                <Text style={[styles.planButtonText, { color: colors.purple.primary }]}>
                  {!isPremium ? 'Plan actuel' : 'Plan Classic'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Premium Plan */}
            <View style={[styles.planCard, { backgroundColor: 'rgba(139, 92, 246, 0.15)', borderColor: colors.purple.primary, borderWidth: 2, width: width - 60 }]}>
              <View style={styles.planHeader}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.planName, { color: colors.text }]}>Legacy</Text>
                  <Text style={[styles.planDescription, { color: colors.textSecondary }]}>
                    Solution complète pour les familles
                  </Text>
                </View>
                <View style={[styles.planBadge, { backgroundColor: colors.purple.primary }]}>
                  <Text style={styles.planBadgeText}>PREMIUM</Text>
                </View>
              </View>

              <View style={styles.planPricing}>
                <Text style={[styles.planPrice, { color: colors.text }]}>10€</Text>
                <Text style={[styles.planPeriod, { color: colors.textSecondary }]}>/mois</Text>
              </View>

              <View style={styles.planFeatures}>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Coffres-forts illimités</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Héritiers illimités</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Stockage jusqu'à 10 Go</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Sécurité avancée</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Support prioritaire</Text>
                </View>
                <View style={styles.featureItem}>
                  <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />
                  <Text style={[styles.featureText, { color: colors.text }]}>Essai gratuit 14 jours</Text>
                </View>
              </View>

              <TouchableOpacity 
                style={[styles.planButton, { backgroundColor: isPremium ? 'transparent' : colors.purple.primary, borderColor: colors.purple.primary, borderWidth: isPremium ? 2 : 0 }]}
                activeOpacity={0.8}
                onPress={isPremium ? undefined : handleUpgrade}
                disabled={isPremium}
              >
                <Text style={[styles.planButtonText, { color: isPremium ? colors.purple.primary : '#FFFFFF' }]}>
                  {isPremium ? 'Plan actuel' : 'Passer au Premium'}
                </Text>
                {!isPremium && <MaterialCommunityIcons name="crown" size={20} color="#FFFFFF" />}
                {isPremium && <MaterialCommunityIcons name="check-circle" size={20} color={colors.purple.primary} />}
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>

        {/* Recent Activity */}
        {recentActivities.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Activité récente
              </Text>
            </View>
            <View style={styles.activityContainer}>
              {recentActivities.map((activity) => (
                <ActivityItem key={activity.id} activity={activity} />
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <View style={styles.footerCard}>
            <MaterialCommunityIcons name="lock" size={20} color={colors.purple.primary} />
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Vos données sont chiffrées de bout en bout
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaViewRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 120, // Augmenté pour éviter que le contenu soit caché par la tab bar
  },
  statsContainer: {
    padding: 20,
    paddingTop: 24,
  },
  section: {
    padding: 20,
    paddingTop: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  quickActionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  quickActionContent: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  quickActionDescription: {
    fontSize: 14,
    color: '#9CA3AF',
    lineHeight: 20,
  },
  activityContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  footer: {
    padding: 20,
    paddingTop: 0,
  },
  footerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(139, 92, 246, 0.2)',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 12,
    flex: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 20,
    lineHeight: 20,
  },
  pricingSection: {
    paddingTop: 0,
    marginBottom: 20,
  },
  pricingSectionHeader: {
    paddingHorizontal: 20,
  },
  plansSlider: {
    paddingHorizontal: 20,
    gap: 16,
  },
  planCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  planName: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  planDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
  planBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 20,
  },
  planPrice: {
    fontSize: 36,
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: 16,
    marginLeft: 4,
  },
  planFeatures: {
    marginBottom: 20,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 12,
  },
  featureText: {
    fontSize: 15,
    flex: 1,
    lineHeight: 22,
  },
  planButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  planButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
