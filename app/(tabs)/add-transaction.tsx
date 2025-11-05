import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { Colors } from '@/constants/theme';
import { addTransaction, getAllCustomers, initDatabase, type Customer } from '@/services/database';
import { getTodayDate } from '@/utils/format';

export default function AddTransactionScreen() {
  const colorScheme = useColorScheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ customerId?: string; type?: 'debt' | 'payment' }>();
  const colors = Colors[colorScheme ?? 'light'];

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    params.customerId ? Number(params.customerId) : null
  );
  const [type, setType] = useState<'debt' | 'payment'>(params.type || 'debt');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(getTodayDate());
  const [note, setNote] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadCustomers();
  }, []);

  useEffect(() => {
    if (params.customerId) {
      setSelectedCustomerId(Number(params.customerId));
    }
  }, [params.customerId]);

  const loadCustomers = async () => {
    try {
      await initDatabase();
      const data = await getAllCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error loading customers:', error);
    }
  };

  const handleSave = async () => {
    if (!selectedCustomerId) {
      Alert.alert('Xatolik', 'Mijozni tanlang');
      return;
    }
    if (!amount.trim() || isNaN(Number(amount)) || Number(amount) <= 0) {
      Alert.alert('Xatolik', 'To\'g\'ri summani kiriting');
      return;
    }
    if (!date) {
      Alert.alert('Xatolik', 'Sanani kiriting');
      return;
    }

    setLoading(true);
    try {
      await addTransaction({
        customer_id: selectedCustomerId,
        type,
        amount: Number(amount),
        date,
        note: note.trim() || undefined,
      });
      Alert.alert('Muvaffaqiyatli', 'Tranzaksiya qo\'shildi', [
        {
          text: 'OK',
          onPress: () => {
            if (params.customerId) {
              router.back();
            } else {
              router.push('/(tabs)/index');
            }
          },
        },
      ]);
    } catch (error) {
      console.error('Error adding transaction:', error);
      Alert.alert('Xatolik', 'Tranzaksiyani qo\'shishda xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const selectedCustomer = customers.find((c) => c.id === selectedCustomerId);

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: colors.text }]}>Yangi Tranzaksiya</Text>
          <View style={styles.backButton} />
        </View>

        <View style={styles.form}>
          {/* Customer Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Mijoz *</Text>
            <TouchableOpacity
              style={[styles.picker, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => {
                router.push({
                  pathname: '/(tabs)/select-customer',
                  params: { returnTo: 'add-transaction', customerId: selectedCustomerId?.toString() || '' },
                });
              }}
            >
              <Text style={[styles.pickerText, { color: selectedCustomer ? colors.text : colors.icon }]}>
                {selectedCustomer ? selectedCustomer.name : 'Mijozni tanlang'}
              </Text>
              <Ionicons name="chevron-forward" size={20} color={colors.icon} />
            </TouchableOpacity>
          </View>

          {/* Type Selection */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Turi *</Text>
            <View style={styles.typeContainer}>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: type === 'debt' ? colors.success : colors.card,
                    borderColor: type === 'debt' ? colors.success : colors.border,
                  },
                ]}
                onPress={() => setType('debt')}
              >
                <Ionicons
                  name="arrow-up-circle"
                  size={24}
                  color={type === 'debt' ? '#FFFFFF' : colors.success}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: type === 'debt' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  Qarz Berish
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.typeButton,
                  {
                    backgroundColor: type === 'payment' ? colors.primary : colors.card,
                    borderColor: type === 'payment' ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setType('payment')}
              >
                <Ionicons
                  name="arrow-down-circle"
                  size={24}
                  color={type === 'payment' ? '#FFFFFF' : colors.primary}
                />
                <Text
                  style={[
                    styles.typeButtonText,
                    { color: type === 'payment' ? '#FFFFFF' : colors.text },
                  ]}
                >
                  To'lov Qabul
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Amount */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Summa *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="Summa kiriting"
              placeholderTextColor={colors.icon}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
            />
          </View>

          {/* Date */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Sana *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
              placeholder="YYYY-MM-DD"
              placeholderTextColor={colors.icon}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Note */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Izoh</Text>
            <TextInput
              style={[
                styles.input,
                styles.textArea,
                { backgroundColor: colors.card, color: colors.text, borderColor: colors.border },
              ]}
              placeholder="Izoh (ixtiyoriy)"
              placeholderTextColor={colors.icon}
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={4}
            />
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary }]}
            onPress={handleSave}
            disabled={loading}
          >
            <Text style={styles.saveButtonText}>
              {loading ? 'Saqalanmoqda...' : 'Saqlash'}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  form: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderRadius: 12,
    padding: 16,
  },
  pickerText: {
    fontSize: 16,
    flex: 1,
  },
  typeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    gap: 8,
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  saveButton: {
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
});

