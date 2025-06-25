import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Heir } from '../../types/heir';

interface ListHeirsProps {
  heirs: Heir[];
  onEdit: (heir: Heir) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}

const ListHeirs = ({
  heirs,
  onEdit,
  onDelete,
  onAdd,
}: ListHeirsProps) => {
  const renderItem = ({ item }: { item: Heir }) => (
    <View style={styles.itemContainer}>
      <View style={styles.avatar}>
        <MaterialIcons name="person" size={24} color="#666" />
      </View>
      <View style={styles.itemContent}>
        <View style={styles.itemHeader}>
          <Text style={styles.name} numberOfLines={1} ellipsizeMode="tail">{item.name}</Text>
          <Text style={styles.percentage}>{item.percentage}%</Text>
        </View>
        <Text style={styles.relationship}>{item.relationship}</Text>
        {item.email ? (
          <View style={styles.detailRow}>
            <MaterialIcons name="email" size={14} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText} numberOfLines={1} ellipsizeMode="tail">{item.email}</Text>
          </View>
        ) : null}
        {item.phone ? (
          <View style={styles.detailRow}>
            <MaterialIcons name="phone" size={14} color="#666" style={styles.detailIcon} />
            <Text style={styles.detailText}>{item.phone}</Text>
          </View>
        ) : null}
      </View>
      <View style={styles.actions}>
        <TouchableOpacity 
          onPress={() => onEdit(item)} 
          style={[styles.actionButton, styles.editButton]}
          accessibilityLabel={`Edit ${item.name}`}
        >
          <MaterialIcons name="edit" size={20} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => onDelete(item.id)} 
          style={[styles.actionButton, styles.deleteButton]}
          accessibilityLabel={`Delete ${item.name}`}
        >
          <MaterialIcons name="delete-outline" size={20} color="#666" />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Heirs</Text>
        <TouchableOpacity onPress={onAdd} style={styles.addButton}>
          <MaterialIcons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
      
      {heirs.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No heirs added yet</Text>
          <TouchableOpacity onPress={onAdd} style={styles.addFirstButton}>
            <MaterialIcons name="add" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
            <Text style={styles.addFirstText}>Add First Heir</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={heirs}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: 'black',
  },
  addButton: {
    backgroundColor: 'black',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 48,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#f0f0f0',
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  itemContent: {
    flex: 1,
    marginRight: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    flex: 1,
    marginRight: 8,
  },
  percentage: {
    fontSize: 15,
    fontWeight: '700',
    color: 'black',
  },
  relationship: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailIcon: {
    marginRight: 8,
    width: 16,
    textAlign: 'center',
  },
  detailText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  editButton: {
    backgroundColor: '#f5f5f5',
  },
  deleteButton: {
    backgroundColor: '#f5f5f5',
  },
  addFirstButton: {
    backgroundColor: 'black',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  addFirstText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
    marginLeft: 8,
  },
});

export { ListHeirs };
