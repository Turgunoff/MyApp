import * as SQLite from "expo-sqlite"

export interface Customer {
  id?: number
  name: string
  phone: string
  address?: string
  created_at?: string
}

export interface Transaction {
  id?: number
  customer_id: number
  type: "debt" | "payment"
  amount: number
  date: string
  note?: string
  created_at?: string
}

let db: SQLite.SQLiteDatabase | null = null

export async function initDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) {
    return db
  }

  db = await SQLite.openDatabaseAsync("qarz_daftari.db")

  // Customers table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
  `)

  // Transactions table
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('debt', 'payment')),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      note TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE
    );
  `)

  return db
}

// Customer operations
export async function getAllCustomers(): Promise<Customer[]> {
  const database = await initDatabase()
  const result = await database.getAllAsync<Customer>(
    "SELECT * FROM customers ORDER BY name ASC"
  )
  return result
}

export async function getCustomer(id: number): Promise<Customer | null> {
  const database = await initDatabase()
  const result = await database.getFirstAsync<Customer>(
    "SELECT * FROM customers WHERE id = ?",
    [id]
  )
  return result || null
}

export async function addCustomer(
  customer: Omit<Customer, "id" | "created_at">
): Promise<number> {
  const database = await initDatabase()
  const result = await database.runAsync(
    "INSERT INTO customers (name, phone, address) VALUES (?, ?, ?)",
    [customer.name, customer.phone, customer.address || null]
  )
  return result.lastInsertRowId
}

export async function updateCustomer(
  id: number,
  customer: Omit<Customer, "id" | "created_at">
): Promise<void> {
  const database = await initDatabase()
  await database.runAsync(
    "UPDATE customers SET name = ?, phone = ?, address = ? WHERE id = ?",
    [customer.name, customer.phone, customer.address || null, id]
  )
}

export async function deleteCustomer(id: number): Promise<void> {
  const database = await initDatabase()
  await database.runAsync("DELETE FROM customers WHERE id = ?", [id])
}

export async function searchCustomers(query: string): Promise<Customer[]> {
  const database = await initDatabase()
  const searchQuery = `%${query}%`
  const result = await database.getAllAsync<Customer>(
    "SELECT * FROM customers WHERE name LIKE ? OR phone LIKE ? ORDER BY name ASC",
    [searchQuery, searchQuery]
  )
  return result
}

// Transaction operations
export async function getCustomerTransactions(
  customerId: number
): Promise<Transaction[]> {
  const database = await initDatabase()
  const result = await database.getAllAsync<Transaction>(
    "SELECT * FROM transactions WHERE customer_id = ? ORDER BY date DESC, created_at DESC",
    [customerId]
  )
  return result
}

export async function getAllTransactions(
  limit?: number
): Promise<Transaction[]> {
  const database = await initDatabase()
  const query = limit
    ? "SELECT * FROM transactions ORDER BY date DESC, created_at DESC LIMIT ?"
    : "SELECT * FROM transactions ORDER BY date DESC, created_at DESC"
  const result = limit
    ? await database.getAllAsync<Transaction>(query, [limit])
    : await database.getAllAsync<Transaction>(query)
  return result
}

export async function addTransaction(
  transaction: Omit<Transaction, "id" | "created_at">
): Promise<number> {
  const database = await initDatabase()
  const result = await database.runAsync(
    "INSERT INTO transactions (customer_id, type, amount, date, note) VALUES (?, ?, ?, ?, ?)",
    [
      transaction.customer_id,
      transaction.type,
      transaction.amount,
      transaction.date,
      transaction.note || null,
    ]
  )
  return result.lastInsertRowId
}

export async function deleteTransaction(id: number): Promise<void> {
  const database = await initDatabase()
  await database.runAsync("DELETE FROM transactions WHERE id = ?", [id])
}

// Statistics
export async function getCustomerBalance(customerId: number): Promise<number> {
  const database = await initDatabase()
  const result = await database.getFirstAsync<{ total: number }>(
    `SELECT 
      COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE -amount END), 0) as total
    FROM transactions 
    WHERE customer_id = ?`,
    [customerId]
  )
  return result?.total || 0
}

export async function getAllCustomersWithBalance(): Promise<
  (Customer & { balance: number })[]
> {
  const database = await initDatabase()
  const result = await database.getAllAsync<Customer & { balance: number }>(
    `SELECT 
      c.*,
      COALESCE(SUM(CASE WHEN t.type = 'debt' THEN t.amount ELSE -t.amount END), 0) as balance
    FROM customers c
    LEFT JOIN transactions t ON c.id = t.customer_id
    GROUP BY c.id
    ORDER BY c.name ASC`
  )
  return result
}

export async function getStatistics() {
  const database = await initDatabase()

  const totalDebts = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(CASE WHEN type = 'debt' THEN amount ELSE -amount END), 0) as total
     FROM transactions`
  )

  const givenDebts = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE type = 'debt'`
  )

  const receivedPayments = await database.getFirstAsync<{ total: number }>(
    `SELECT COALESCE(SUM(amount), 0) as total
     FROM transactions WHERE type = 'payment'`
  )

  const overdueCount = await database.getFirstAsync<{ count: number }>(
    `SELECT COUNT(DISTINCT customer_id) as count
     FROM (
       SELECT customer_id,
         SUM(CASE WHEN type = 'debt' THEN amount ELSE -amount END) as balance
       FROM transactions
       GROUP BY customer_id
       HAVING balance > 0 AND date < date('now')
     )`
  )

  return {
    totalDebts: totalDebts?.total || 0,
    givenDebts: givenDebts?.total || 0,
    receivedPayments: receivedPayments?.total || 0,
    overdueCount: overdueCount?.count || 0,
  }
}
