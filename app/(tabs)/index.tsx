import { QuickAccessCard, RecentActivity } from '@/components/home';
import type { ActivityItem as ActivityItemType } from '@/components/home/RecentActivity';
import { useRouter } from 'expo-router';
import React from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView as SafeAreaViewRN } from 'react-native-safe-area-context';
import { useAuth } from '../../contexts/AuthContext';

const QUICK_ACCESS = [
  {
    id: '1',
    title: 'Secure Vault',
    description: 'Store and manage your important documents',
    icon: 'lock',
    color: 'black',
    route: '/vaults',
  },
  {
    id: '2',
    title: 'Heir Management',
    description: 'Manage who can access your digital legacy',
    icon: 'account-group',
    color: 'black',
    route: '/heirs',
  },
  {
    id: '3',
    title: 'Emergency Access',
    description: 'Set up emergency contacts and rules',
    icon: 'shield-account',
    color: 'black',
    route: '/emergency',
  },
];

const RECENT_ACTIVITIES: ActivityItemType[] = [
  {
    id: '1',
    type: 'document',
    title: 'Will.pdf',
    description: 'Document uploaded',
    time: '2h ago',
  },
  {
    id: '2',
    type: 'heir',
    title: 'John Doe',
    description: 'Heir added',
    time: '1d ago',
  },
  {
    id: '3',
    type: 'security',
    title: 'Security',
    description: 'Password updated',
    time: '2d ago',
  },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Simulate data refresh
    setTimeout(() => setRefreshing(false), 1000);
  }, []);

  return (
    <SafeAreaViewRN style={styles.container} edges={['top']}>
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Access</Text>
          {QUICK_ACCESS.map((card) => (
            <QuickAccessCard
              key={card.id}
              title={card.title}
              description={card.description}
              icon={card.icon as any}
              color={card.color}
              route={card.route}
            />
          ))}
        </View>

        <View style={styles.section}>
          <RecentActivity activities={RECENT_ACTIVITIES} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Your data is securely encrypted and protected
          </Text>
        </View>
      </ScrollView>
    </SafeAreaViewRN>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 8,
  },
  greeting: {
    fontSize: 16,
    color: '#8E8E93',
  },
  userName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1C1C1E',
    marginTop: 4,
    maxWidth: '80%',
  },
  section: {
    padding: 16,
    paddingTop: 0,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1C1C1E',
    marginBottom: 16,
    marginTop: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
  },
  footer: {
    padding: 16,
    backgroundColor: '#F8F8F8',
  },
  footerText: {
    paddingHorizontal: 20,
    marginBottom: 40,
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 12,
  },
  emptyState: {
    backgroundColor: '#F9F9FB',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#C7C7CC',
    marginTop: 4,
  },
});
