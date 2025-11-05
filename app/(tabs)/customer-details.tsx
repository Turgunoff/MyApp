import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Alert,
  Linking,
  RefreshControl,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import {
  getCustomer,
  getCustomerTransactions,
  getCustomerBalance,
  deleteTransaction,
  initDatabase,
  type Customer,
  type Transaction,
} from '@/services/database';
import { formatCurrency, formatDate } from '@/utils/format';
import { useApp } from '@/contexts/AppContext';

export default function CustomerDetailsScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { currency } = useApp();
  const colors = Colors[colorScheme ?? 'light'];

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [balance, setBalance] = useState(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    if (!id) return;

    try {
      await initDatabase();
      const customerData = await getCustomer(Number(id));
      if (!customerData) {
        Alert.alert('Xatolik', 'Mijoz topilmadi', [
          { text: 'OK', onPress: () => router.back() },
        ]);
        return;
      }

      setCustomer(customerData);
      const customerBalance = await getCustomerBalance(Number(id));
      setBalance(customerBalance);
      const transactionsData = await getCustomerTransactions(Number(id));
      setTransactions(transactionsData);
    } catch (error) {
      console.error('Error loading customer data:', error);
      Alert.alert('Xatolik', 'Ma\'lumotlarni yuklashda xatolik yuz berdi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleCall = () => {
    if (customer?.phone) {
      Linking.openURL(`tel:${customer.phone}`);
    }
  };

  const handleAddDebt = () => {
    router.push(`/(tabs)/add-transaction?customerId=${id}&type=debt`);
  };

  const handleAddPayment = () => {
    router.push(`/(tabs)/add-transaction?customerId=${id}&type=payment`);
  };

  const handleDeleteTransaction = (transactionId: number) => {
    Alert.alert(
      'O\'chirish',
      'Bu tranzaksiyani o\'chirishni xohlaysizmi?',
      [
        { text: 'Bekor qilish', style: 'cancel' },
        {
          text: 'O\'chirish',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteTransaction(transactionId);
              loadData();
            } catch (error) {
              Alert.alert('Xatolik', 'Tranzaksiyani o\'chirishda xatolik yuz berdi');
            }
          },
        },
      ]
    );
  };

  if (loading || !customer) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>Yuklanmoqda...</Text>
      </View>
    );
  }

  const renderTransaction = ({ item }: { item: Transaction }) => {
    return (
      <View
        style={[styles.transactionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <View style={styles.transactionTypeRow}>
              <Ionicons
                name={item.type === 'debt' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={24}
                color={item.type === 'debt' ? colors.success : colors.primary}
              />
              <Text style={[styles.transactionType, { color: colors.text }]}>
                {item.type === 'debt' ? 'Qarz berildi' : 'To\'lov qabul qilindi'}
              </Text>
            </View>
            <Text style={[styles.transactionDate, { color: colors.icon }]}>
              {formatDate(item.date)}
            </Text>
            {item.note && (
              <Text style={[styles.transactionNote, { color: colors.icon }]}>{item.note}</Text>
            )}
          </View>
          <View style={styles.transactionActions}>
            <Text
              style={[
                styles.transactionAmount,
                {
                  color: item.type === 'debt' ? colors.success : colors.primary,
                },
              ]}
            >
              {item.type === 'debt' ? '+' : '-'}
              {formatCurrency(item.amount, currency)}
            </Text>
            <TouchableOpacity
              onPress={() => handleDeleteTransaction(item.id!)}
              style={styles.deleteButton}
            >
              <Ionicons name="trash-outline" size={18} color={colors.danger} />
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Mijoz Ma'lumotlari</Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Customer Info Card */}
        <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.customerName, { color: colors.text }]}>{customer.name}</Text>
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={colors.icon} />
            <Text style={[styles.infoText, { color: colors.text }]}>{customer.phone}</Text>
          </View>
          {customer.address && (
            <View style={styles.infoRow}>
              <Ionicons name="location-outline" size={20} color={colors.icon} />
              <Text style={[styles.infoText, { color: colors.text }]}>{customer.address}</Text>
            </View>
          )}
          <View style={[styles.balanceCard, { backgroundColor: colors.background }]}>
            <Text style={[styles.balanceLabel, { color: colors.icon }]}>Jami Qarz</Text>
            <Text
              style={[
                styles.balanceAmount,
                {
                  color: balance > 0 ? colors.success : balance < 0 ? colors.danger : colors.text,
                },
              ]}
            >
              {formatCurrency(balance, currency)}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.success }]}
            onPress={handleAddDebt}
          >
            <Ionicons name="add-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Qarz Berish</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={handleAddPayment}
          >
            <Ionicons name="checkmark-circle" size={24} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>To'lov Qabul</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.callButton, { borderColor: colors.primary }]}
            onPress={handleCall}
          >
            <Ionicons name="call" size={24} color={colors.primary} />
            <Text style={[styles.actionButtonText, { color: colors.primary }]}>Qo'ng'iroq</Text>
          </TouchableOpacity>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tranzaksiyalar Tarixi</Text>
          {transactions.length === 0 ? (
            <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
              <Ionicons name="document-text-outline" size={48} color={colors.icon} />
              <Text style={[styles.emptyText, { color: colors.icon }]}>
                Hozircha tranzaksiyalar yo'q
              </Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              renderItem={renderTransaction}
              keyExtractor={(item) => item.id!.toString()}
              scrollEnabled={false}
            />
          )}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  infoCard: {
    margin: 16,
    padding: 20,
    borderRadius: 12,
    borderWidth: 1,
  },
  customerName: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 16,
    flex: 1,
  },
  balanceCard: {
    marginTop: 16,
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    marginBottom: 4,
  },
  balanceAmount: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  actionsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    gap: 8,
  },
  callButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  transactionCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  transactionType: {
    fontSize: 16,
    fontWeight: '600',
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 14,
  },
  transactionActions: {
    alignItems: 'flex-end',
    gap: 8,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 4,
  },
  emptyCard: {
    padding: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: 'center',
  },
});

