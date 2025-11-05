import { Currency } from "@/utils/format"
import AsyncStorage from "@react-native-async-storage/async-storage"
import React, {
  createContext,
  ReactNode,
  useContext,
  useEffect,
  useState,
} from "react"

interface AppContextType {
  currency: Currency
  setCurrency: (currency: Currency) => void
}

const AppContext = createContext<AppContextType | undefined>(undefined)

export function AppProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("UZS")

  useEffect(() => {
    loadCurrency()
  }, [])

  const loadCurrency = async () => {
    try {
      const saved = await AsyncStorage.getItem("currency")
      if (saved && ["UZS", "USD", "RUB"].includes(saved)) {
        setCurrencyState(saved as Currency)
      }
    } catch (error) {
      console.error("Error loading currency:", error)
    }
  }

  const setCurrency = async (newCurrency: Currency) => {
    try {
      await AsyncStorage.setItem("currency", newCurrency)
      setCurrencyState(newCurrency)
    } catch (error) {
      console.error("Error saving currency:", error)
    }
  }

  return (
    <AppContext.Provider value={{ currency, setCurrency }}>
      {children}
    </AppContext.Provider>
  )
}

export function useApp() {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error("useApp must be used within an AppProvider")
  }
  return context
}
