import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

export type StatItem = {
  id: string;
  title: string;
  value: string | number;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  color: string;
  change?: number;
};

type StatsOverviewProps = {
  stats: StatItem[];
};

export const StatsOverview = ({ stats }: StatsOverviewProps) => {
  return (
    <View style={styles.container}>
      {stats.map((stat) => (
        <View key={stat.id} style={styles.statCard}>
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons name={stat.icon} size={20} color="black" />
          </View>
          <View style={styles.statContent}>
            <Text style={styles.statValue}>{stat.value}</Text>
            <Text style={styles.statTitle}>{stat.title}</Text>
          </View>
          {stat.change !== undefined && (
            <View style={styles.changeBadge}>
              <MaterialCommunityIcons
                name={stat.change >= 0 ? 'trending-up' : 'trending-down'}
                size={14}
                color="black"
              />
              <Text style={styles.changeText}>
                {Math.abs(stat.change)}%
              </Text>
            </View>
          )}
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
    marginTop: 8,
  },
  statCard: {
    width: '50%',
    padding: 6,
  },
  statContent: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: -12,
    left: 16,
    zIndex: 1,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: 'black',
    marginTop: 8,
    marginBottom: 4,
  },
  statTitle: {
    fontSize: 13,
    color: '#666666',
  },
  changeBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: '#f5f5f5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
    color: 'black',
  },
});
