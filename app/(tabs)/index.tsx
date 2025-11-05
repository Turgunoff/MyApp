import { Colors } from "@/constants/theme"
import { useApp } from "@/contexts/AppContext"
import { useColorScheme } from "@/hooks/use-color-scheme"
import {
  getAllCustomersWithBalance,
  getAllTransactions,
  getStatistics,
  initDatabase,
} from "@/services/database"
import { formatCurrency } from "@/utils/format"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

export default function HomeScreen() {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const { currency } = useApp()
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [stats, setStats] = useState({
    totalDebts: 0,
    givenDebts: 0,
    receivedPayments: 0,
    overdueCount: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState<any[]>([])
  const [overdueCustomers, setOverdueCustomers] = useState<any[]>([])

  const loadData = async () => {
    try {
      await initDatabase()
      const statistics = await getStatistics()
      setStats(statistics)

      const transactions = await getAllTransactions(7)
      const customers = await getAllCustomersWithBalance()

      // Get customer names for transactions
      const transactionsWithNames = await Promise.all(
        transactions.map(async (t) => {
          const customerList = await getAllCustomersWithBalance()
          const customer = customerList.find((c) => c.id === t.customer_id)
          return {
            ...t,
            customerName: customer?.name || "Unknown",
          }
        })
      )

      setRecentTransactions(transactionsWithNames)

      // Get overdue customers (balance > 0)
      const overdue = customers.filter((c) => c.balance > 0)
      setOverdueCustomers(overdue.slice(0, 5))
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const onRefresh = () => {
    setRefreshing(true)
    loadData()
  }

  const handleCall = (phone: string) => {
    Linking.openURL(`tel:${phone}`)
  }

  const colors = Colors[colorScheme ?? "light"]

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={[styles.loadingText, { color: colors.text }]}>
          Yuklanmoqda...
        </Text>
      </View>
    )
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Qarz Daftari</Text>
        <Text style={[styles.subtitle, { color: colors.icon }]}>Dashboard</Text>
      </View>

      {/* Statistics Cards */}
      <View style={styles.statsContainer}>
        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons name='wallet-outline' size={24} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Jami Qarz
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(stats.totalDebts, currency)}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons
              name='arrow-up-circle-outline'
              size={24}
              color={colors.success}
            />
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Berilgan
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(stats.givenDebts, currency)}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons
              name='arrow-down-circle-outline'
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Olingan
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.text }]}>
            {formatCurrency(stats.receivedPayments, currency)}
          </Text>
        </View>

        <View
          style={[
            styles.statCard,
            { backgroundColor: colors.card, borderColor: colors.border },
          ]}
        >
          <View style={styles.statHeader}>
            <Ionicons
              name='alert-circle-outline'
              size={24}
              color={colors.danger}
            />
            <Text style={[styles.statLabel, { color: colors.icon }]}>
              Muddati O'tgan
            </Text>
          </View>
          <Text style={[styles.statValue, { color: colors.danger }]}>
            {stats.overdueCount} ta
          </Text>
        </View>
      </View>

      {/* Overdue Customers */}
      {overdueCustomers.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>
              Muddati O'tgan Qarzlar
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/customers")}>
              <Text style={[styles.seeAll, { color: colors.primary }]}>
                Barchasi
              </Text>
            </TouchableOpacity>
          </View>
          {overdueCustomers.map((customer) => (
            <TouchableOpacity
              key={customer.id}
              style={[
                styles.customerCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
              onPress={() =>
                router.push(`/(tabs)/customer-details?id=${customer.id}`)
              }
            >
              <View style={styles.customerInfo}>
                <Text style={[styles.customerName, { color: colors.text }]}>
                  {customer.name}
                </Text>
                <Text style={[styles.customerPhone, { color: colors.icon }]}>
                  {customer.phone}
                </Text>
              </View>
              <View style={styles.customerActions}>
                <Text
                  style={[styles.customerBalance, { color: colors.danger }]}
                >
                  {formatCurrency(customer.balance, currency)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleCall(customer.phone)}
                  style={styles.callButton}
                >
                  <Ionicons name='call' size={20} color={colors.primary} />
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Recent Transactions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            Oxirgi Tranzaksiyalar
          </Text>
          <TouchableOpacity
            onPress={() => router.push("/(tabs)/add-transaction")}
          >
            <Ionicons name='add-circle' size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>
        {recentTransactions.length === 0 ? (
          <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
            <Ionicons
              name='document-text-outline'
              size={48}
              color={colors.icon}
            />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              Hozircha tranzaksiyalar yo'q
            </Text>
          </View>
        ) : (
          recentTransactions.map((transaction) => (
            <View
              key={transaction.id}
              style={[
                styles.transactionCard,
                { backgroundColor: colors.card, borderColor: colors.border },
              ]}
            >
              <View style={styles.transactionInfo}>
                <View style={styles.transactionHeader}>
                  <Ionicons
                    name={
                      transaction.type === "debt" ? "arrow-up" : "arrow-down"
                    }
                    size={20}
                    color={
                      transaction.type === "debt"
                        ? colors.success
                        : colors.primary
                    }
                  />
                  <Text
                    style={[styles.transactionCustomer, { color: colors.text }]}
                  >
                    {transaction.customerName}
                  </Text>
                </View>
                <Text style={[styles.transactionDate, { color: colors.icon }]}>
                  {new Date(transaction.date).toLocaleDateString("uz-UZ")}
                </Text>
                {transaction.note && (
                  <Text
                    style={[styles.transactionNote, { color: colors.icon }]}
                    numberOfLines={1}
                  >
                    {transaction.note}
                  </Text>
                )}
              </View>
              <Text
                style={[
                  styles.transactionAmount,
                  {
                    color:
                      transaction.type === "debt"
                        ? colors.success
                        : colors.primary,
                  },
                ]}
              >
                {transaction.type === "debt" ? "+" : "-"}
                {formatCurrency(transaction.amount, currency)}
              </Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingText: {
    textAlign: "center",
    marginTop: 50,
    fontSize: 16,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 16,
    gap: 12,
  },
  statCard: {
    width: "47%",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  statHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "bold",
  },
  section: {
    padding: 16,
    marginTop: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
  },
  seeAll: {
    fontSize: 14,
    fontWeight: "600",
  },
  customerCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  customerInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  customerPhone: {
    fontSize: 14,
  },
  customerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  customerBalance: {
    fontSize: 16,
    fontWeight: "bold",
  },
  callButton: {
    padding: 8,
  },
  transactionCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 4,
  },
  transactionCustomer: {
    fontSize: 16,
    fontWeight: "600",
  },
  transactionDate: {
    fontSize: 12,
    marginBottom: 4,
  },
  transactionNote: {
    fontSize: 12,
  },
  transactionAmount: {
    fontSize: 18,
    fontWeight: "bold",
  },
  emptyCard: {
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    textAlign: "center",
  },
})
