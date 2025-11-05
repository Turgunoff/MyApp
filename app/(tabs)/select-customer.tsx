import { Colors } from "@/constants/theme"
import { useColorScheme } from "@/hooks/use-color-scheme"
import {
  getAllCustomers,
  initDatabase,
  type Customer,
} from "@/services/database"
import { Ionicons } from "@expo/vector-icons"
import { useLocalSearchParams, useRouter } from "expo-router"
import React, { useEffect, useState } from "react"
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native"

export default function SelectCustomerScreen() {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const params = useLocalSearchParams<{ returnTo?: string; customerId?: string }>()
  const colors = Colors[colorScheme ?? "light"]

  const [customers, setCustomers] = useState<Customer[]>([])
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([])
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    loadCustomers()
  }, [])

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredCustomers(customers)
    } else {
      const filtered = customers.filter(
        (customer) =>
          customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          customer.phone.includes(searchQuery)
      )
      setFilteredCustomers(filtered)
    }
  }, [searchQuery, customers])

  const loadCustomers = async () => {
    try {
      await initDatabase()
      const data = await getAllCustomers()
      setCustomers(data)
      setFilteredCustomers(data)
    } catch (error) {
      console.error("Error loading customers:", error)
    }
  }

  const handleSelect = (customer: Customer) => {
    router.back();
    // Navigate back and update params
    setTimeout(() => {
      if (params.returnTo === 'add-transaction') {
        router.setParams({ customerId: customer.id!.toString() });
      }
    }, 200);
  }

  const renderCustomer = ({ item }: { item: Customer }) => {
    return (
      <TouchableOpacity
        style={[
          styles.customerCard,
          { backgroundColor: colors.card, borderColor: colors.border },
        ]}
        onPress={() => handleSelect(item)}
      >
        <View style={styles.customerInfo}>
          <Text style={[styles.customerName, { color: colors.text }]}>
            {item.name}
          </Text>
          <Text style={[styles.customerPhone, { color: colors.icon }]}>
            {item.phone}
          </Text>
        </View>
        <Ionicons name='chevron-forward' size={20} color={colors.icon} />
      </TouchableOpacity>
    )
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <Ionicons name='arrow-back' size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Mijozni Tanlash
        </Text>
        <View style={styles.backButton} />
      </View>

      <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
        <Ionicons
          name='search'
          size={20}
          color={colors.icon}
          style={styles.searchIcon}
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder='Qidirish...'
          placeholderTextColor={colors.icon}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Ionicons name='close-circle' size={20} color={colors.icon} />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={filteredCustomers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id!.toString()}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          <View
            style={[styles.emptyContainer, { backgroundColor: colors.card }]}
          >
            <Ionicons name='people-outline' size={64} color={colors.icon} />
            <Text style={[styles.emptyText, { color: colors.icon }]}>
              {searchQuery ? "Mijoz topilmadi" : "Hozircha mijozlar yo'q"}
            </Text>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
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
  emptyContainer: {
    padding: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    textAlign: "center",
  },
})
