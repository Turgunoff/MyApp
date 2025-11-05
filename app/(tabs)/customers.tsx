import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  RefreshControl,
  Linking,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  getAllCustomersWithBalance,
  deleteCustomer,
  searchCustomers,
  initDatabase,
  type Customer,
} from '@/services/database';
import { formatCurrency } from '@/utils/format';
import { useApp } from '@/contexts/AppContext';

export default function CustomersScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { currency } = useApp();
  const [customers, setCustomers] = useState<(Customer & { balance: number })[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<(Customer & { balance: number })[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadCustomers = async () => {
    try {
      await initDatabase();
      const data = await getAllCustomersWithBalance();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
      Alert.alert('Xatolik', 'Mijozlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCustomers(customers);
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery)
      );
      setFilteredCustomers(filtered);
    }
  }, [searchQuery, customers]);

  const onRefresh = () => {
    setRefreshing(true);
    loadCustomers();
  };

  const handleDelete = (customer: Customer & { balance: number }) => {
    if (customer.balance !== 0) {
      Alert.alert(
        'Ogohlantirish',
        'Bu mijozda qarz bor. Avval barcha tranzaksiyalarni tozalang.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'O\'chirish',
      `${customer.name} ni o'chirishni xohlaysizmi?`,
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCustomer(customer.id!);
              loadCustomers();
            } catch (error) {
              Alert.alert('Xatolik', 'Mijozni o\'chirishda xatolik yuz berdi');
            }
          },
        },
      ]
    );
  };

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`);
  };

  const colors = Colors[colorScheme ?? 'light'];

  const renderCustomer = ({ item }: { item: Customer & { balance: number } }) => {
    const isPositive = item.balance > 0;
    const isNegative = item.balance < 0;

    return (
      <TouchableOpacity
        style={[styles.customerCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/(tabs)/customer-details?id=${item.id}`)}
      >
        <View style={styles.customerMain}>
          <View style={styles.customerInfo}>
            <View style={styles.customerHeader}>
              <Text style={[styles.customerName, { color: colors.text }]}>{item.name}</Text>
              <View
                style={[
                  styles.statusDot,
                  {
                    backgroundColor: isPositive
                      ? colors.success
                      : isNegative
                      ? colors.danger
                      : colors.icon,
                  },
                ]}
              />
            </View>
            <Text style={[styles.customerPhone, { color: colors.icon }]}>{item.phone}</Text>
            {item.address && (
              <Text style={[styles.customerAddress, { color: colors.icon }]} numberOfLines={1}>
                {item.address}
              </Text>
            )}
          </View>
          <View style={styles.customerActions}>
            <Text
              style={[
                styles.customerBalance,
                {
                  color: isPositive ? colors.success : isNegative ? colors.danger : colors.text,
                },
              ]}
            >
              {formatCurrency(item.balance, currency)}
            </Text>
            <View style={styles.actionButtons}>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleCall(item.phone);
                }}
                style={styles.actionButton}
              >
                <Ionicons name="call" size={20} color={colors.primary} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={(e) => {
                  e.stopPropagation();
                  handleDelete(item);
                }}
                style={styles.actionButton}
              >
                <Ionicons name="trash-outline" size={20} color={colors.danger} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Yuklanmoqda...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Mijozlar</Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={() => router.push('/(tabs)/add-customer')}
        >
          <Ionicons name="add" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons name="search" size={20} color={colors.icon} style={styles.searchIcon} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Qidirish..."
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={[styles.emptyContainer, { backgroundColor: colors.card }]}>
            <Ionicons name="people-outline" size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery ? 'Mijoz topilmadi' : 'Hozircha mijozlar yo\'q'}
            </Text>
            {!searchQuery && (
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.primary }]}
                onPress={() => router.push('/(tabs)/add-customer')}
              >
                <Text style={styles.emptyButtonText}>Mijoz qo'shish</Text>
              </TouchableOpacity>
            )}
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  searchIcon: {
    marginRight: 4,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  customerCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  customerMain: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  customerInfo: {
    flex: 1,
  },
  customerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  customerName: {
    fontSize: 18,
    fontWeight: '600',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  customerPhone: {
    fontSize: 14,
    marginBottom: 4,
  },
  customerAddress: {
    fontSize: 12,
  },
  customerActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  customerBalance: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 8,
  },
  emptyContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

