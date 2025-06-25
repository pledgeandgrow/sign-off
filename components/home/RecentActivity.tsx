import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type ActivityItem = {
  id: string;
  type: 'document' | 'heir' | 'settings' | 'security';
  title: string;
  description: string;
  time: string;
};

type RecentActivityProps = {
  activities: ActivityItem[];
  maxItems?: number;
};

export const RecentActivity = ({ activities, maxItems = 3 }: RecentActivityProps) => {
  const getIcon = (type: ActivityItem['type']) => {
    switch (type) {
      case 'document':
        return 'file-document';
      case 'heir':
        return 'account-group';
      case 'settings':
        return 'cog';
      case 'security':
        return 'shield-check';
      default:
        return 'alert-circle';
    }
  };

  const renderItem = ({ item }: { item: ActivityItem }) => (
    <View style={styles.activityItem}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name={getIcon(item.type) as any} 
          size={20} 
          color="black" 
        />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.activityDescription} numberOfLines={1}>
          {item.description}
        </Text>
      </View>
      <Text style={styles.activityTime}>{item.time}</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>Recent Activity</Text>
      <FlatList
        data={activities.slice(0, maxItems)}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginBottom: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
    marginRight: 8,
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: 'black',
    marginBottom: 2,
  },
  activityDescription: {
    fontSize: 12,
    color: '#666666',
  },
  activityTime: {
    fontSize: 12,
    color: '#999999',
    marginLeft: 'auto',
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
    marginLeft: 48,
    marginVertical: 8,
  },
});
