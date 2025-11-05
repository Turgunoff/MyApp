import { Colors } from "@/constants/theme"
import { useApp } from "@/contexts/AppContext"
import { useColorScheme } from "@/hooks/use-color-scheme"
import { Currency } from "@/utils/format"
import { Ionicons } from "@expo/vector-icons"
import { useRouter } from "expo-router"
import * as SQLite from "expo-sqlite"
import React from "react"
import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native"

export default function SettingsScreen() {
  const colorScheme = useColorScheme()
  const router = useRouter()
  const { currency, setCurrency } = useApp()
  const colors = Colors[colorScheme ?? "light"]

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency)
  }

  const handleClearData = () => {
    Alert.alert(
      "Ma'lumotlarni Tozalash",
      "Barcha ma'lumotlar o'chiriladi. Bu amalni qaytarib bo'lmaydi. Davom etasizmi?",
      [
        { text: "Bekor qilish", style: "cancel" },
        {
          text: "Tozalash",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await SQLite.openDatabaseAsync("qarz_daftari.db")
              await db.execAsync("DELETE FROM transactions")
              await db.execAsync("DELETE FROM customers")
              Alert.alert("Muvaffaqiyatli", "Barcha ma'lumotlar tozalandi")
            } catch (error) {
              Alert.alert(
                "Xatolik",
                "Ma'lumotlarni tozalashda xatolik yuz berdi"
              )
            }
          },
        },
      ]
    )
  }

  const SettingItem = ({
    icon,
    title,
    subtitle,
    onPress,
    rightComponent,
  }: {
    icon: string
    title: string
    subtitle?: string
    onPress?: () => void
    rightComponent?: React.ReactNode
  }) => (
    <TouchableOpacity
      style={[
        styles.settingItem,
        { backgroundColor: colors.card, borderColor: colors.border },
      ]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.settingLeft}>
        <Ionicons name={icon as any} size={24} color={colors.primary} />
        <View style={styles.settingText}>
          <Text style={[styles.settingTitle, { color: colors.text }]}>
            {title}
          </Text>
          {subtitle && (
            <Text style={[styles.settingSubtitle, { color: colors.icon }]}>
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      {rightComponent ||
        (onPress && (
          <Ionicons name='chevron-forward' size={20} color={colors.icon} />
        ))}
    </TouchableOpacity>
  )

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Sozlamalar</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          UMUMIY
        </Text>

        <View style={styles.settingsGroup}>
          <Text style={[styles.settingGroupTitle, { color: colors.text }]}>
            Valyuta
          </Text>
          <View style={styles.currencyContainer}>
            {(["UZS", "USD", "RUB"] as Currency[]).map((curr) => (
              <TouchableOpacity
                key={curr}
                style={[
                  styles.currencyButton,
                  {
                    backgroundColor:
                      currency === curr ? colors.primary : colors.card,
                    borderColor:
                      currency === curr ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => handleCurrencyChange(curr)}
              >
                <Text
                  style={[
                    styles.currencyButtonText,
                    { color: currency === curr ? "#FFFFFF" : colors.text },
                  ]}
                >
                  {curr}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          MA\'LUMOTLAR
        </Text>

        <SettingItem
          icon='save-outline'
          title='Backup/Restore'
          subtitle="Ma'lumotlarni saqlash yoki tiklash"
          onPress={() =>
            Alert.alert("Tez orada", "Bu funksiya tez orada qo'shiladi")
          }
        />

        <SettingItem
          icon='trash-outline'
          title="Ma'lumotlarni Tozalash"
          subtitle="Barcha ma'lumotlarni o'chirish"
          onPress={handleClearData}
        />
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.icon }]}>
          ILOVA HAQIDA
        </Text>

        <SettingItem
          icon='information-circle-outline'
          title='Versiya'
          subtitle='1.0.0'
        />

        <SettingItem
          icon='document-text-outline'
          title='Qarz Daftari'
          subtitle='MVP v1.0'
        />
      </View>

      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: colors.icon }]}>
          © 2024 Qarz Daftari
        </Text>
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  settingsGroup: {
    marginBottom: 20,
  },
  settingGroupTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
  },
  currencyContainer: {
    flexDirection: "row",
    gap: 12,
  },
  currencyButton: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
  },
  currencyButtonText: {
    fontSize: 16,
    fontWeight: "600",
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  settingLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    flex: 1,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: "center",
    marginBottom: 40,
  },
  footerText: {
    fontSize: 12,
  },
})
