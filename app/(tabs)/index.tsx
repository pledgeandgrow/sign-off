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
    action: 'create-vault',
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
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
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
  
  // Calculate security stats
  const securedVaults = vaults.filter(v => v.isEncrypted).length;
  const securityPercentage = vaultsCount > 0 ? Math.round((securedVaults / vaultsCount) * 100) : 0;
  
  // Get recent items (last 3)
  const recentItems = vaults
    .flatMap(v => (v.items || []).map(item => ({ ...item, vaultName: v.name })))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  // Security tips
  const securityTips = [
    { icon: 'shield-lock', text: 'Activez le chiffrement sur vos coffres sensibles', color: '#10B981' },
    { icon: 'key-variant', text: 'Utilisez des mots de passe forts et uniques', color: '#F59E0B' },
    { icon: 'account-group', text: 'Configurez au moins un héritier de confiance', color: '#8B5CF6' },
    { icon: 'update', text: 'Mettez à jour régulièrement vos informations', color: '#3B82F6' },
    { icon: 'two-factor-authentication', text: 'Activez l\'authentification à deux facteurs', color: '#EF4444' },
  ];

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

    // Redirect to upgrade screen with in-app purchases
    router.push('/upgrade');
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

  // Rotate security tips
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTipIndex((prev) => (prev + 1) % securityTips.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  // Real stats data
  const STATS_DATA = [
    { label: 'Coffres-forts', value: vaultsCount.toString(), icon: 'lock', color: colors.purple.primary },
    { label: 'Éléments', value: totalItems.toString(), icon: 'folder-multiple', color: '#3B82F6' },
    { label: 'Héritiers', value: heirsCount.toString(), icon: 'account-group', color: '#10B981' },
    { label: 'Coffres protégés', value: `${securityPercentage}%`, icon: 'shield-check', color: securityPercentage >= 50 ? '#10B981' : '#F59E0B' },
  ];

  const QuickActionCard = ({ item }: { item: typeof QUICK_ACTIONS[0] }) => {
    const handlePress = () => {
      if (item.action === 'create-vault') {
        router.push({ pathname: item.route as any, params: { openCreate: 'true' } });
      } else {
        router.push(item.route as any);
      }
    };

    return (
      <TouchableOpacity
        style={styles.quickActionCard}
        onPress={handlePress}
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
  };

  const StatCard = ({ stat }: { stat: typeof STATS_DATA[0] }) => (
    <View style={styles.statCard}>
      <View style={[styles.statIconContainer, { backgroundColor: stat.color + '20' }]}>
        <MaterialCommunityIcons name={stat.icon as any} size={20} color={stat.color} />
      </View>
      <Text style={styles.statValue}>{stat.value}</Text>
      <Text style={styles.statLabel}>{stat.label}</Text>
    </View>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bonjour';
    if (hour < 18) return 'Bon après-midi';
    return 'Bonsoir';
  };

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
        {/* Welcome Header */}
        <View style={styles.welcomeHeader}>
          <View>
            <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.email?.split('@')[0] || 'Utilisateur'}
            </Text>
          </View>
          <TouchableOpacity 
            style={[styles.notificationButton, { backgroundColor: 'rgba(139, 92, 246, 0.1)' }]}
            onPress={() => router.push('/profile')}
          >
            <MaterialCommunityIcons name="bell-outline" size={24} color={colors.purple.primary} />
          </TouchableOpacity>
        </View>

        {/* Security Tip Banner */}
        <View style={styles.tipBanner}>
          <View style={[styles.tipIconContainer, { backgroundColor: securityTips[currentTipIndex].color + '20' }]}>
            <MaterialCommunityIcons 
              name={securityTips[currentTipIndex].icon as any} 
              size={24} 
              color={securityTips[currentTipIndex].color} 
            />
          </View>
          <Text style={[styles.tipText, { color: colors.text }]}>
            {securityTips[currentTipIndex].text}
          </Text>
        </View>

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

        {/* Recent Items */}
        {recentItems.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Éléments récents
              </Text>
              <TouchableOpacity onPress={() => router.push('/vaults')}>
                <Text style={[styles.seeAllText, { color: colors.purple.primary }]}>Tout voir</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentItemsContainer}>
              {recentItems.map((item) => (
                <View key={item.id} style={styles.recentItem}>
                  <View style={[styles.recentItemIcon, { backgroundColor: colors.purple.primary + '20' }]}>
                    <MaterialCommunityIcons 
                      name={item.type === 'password' ? 'key-variant' : item.type === 'document' ? 'file-document' : item.type === 'image' ? 'image' : item.type === 'video' ? 'video' : 'note-text'} 
                      size={20} 
                      color={colors.purple.primary} 
                    />
                  </View>
                  <View style={styles.recentItemContent}>
                    <Text style={[styles.recentItemTitle, { color: colors.text }]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={[styles.recentItemSubtitle, { color: colors.textSecondary }]} numberOfLines={1}>
                      {item.vaultName}
                    </Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={colors.textTertiary} />
                </View>
              ))}
            </View>
          </View>
        )}

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
  welcomeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 16,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  userName: {
    fontSize: 24,
    fontWeight: '700',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  tipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    width: (width - 56) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  statValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: '#9CA3AF',
    textAlign: 'center',
  },
  recentItemsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  recentItemIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  recentItemContent: {
    flex: 1,
  },
  recentItemTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  recentItemSubtitle: {
    fontSize: 13,
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
