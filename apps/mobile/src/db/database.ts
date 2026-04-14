import * as SQLite from "expo-sqlite";

// Singleton variable to hold the database connection and prevent multiple openings
let db: SQLite.SQLiteDatabase | null = null;

// Opens the database or returns the existing connection
export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (db) return db; // Return if already opened
  db = await SQLite.openDatabaseAsync("kortex.db"); // Create/Open 'kortex.db'
  await initSchema(db); // Initialize tables
  return db;
}

// Defines the tables and performance indexes
async function initSchema(database: SQLite.SQLiteDatabase): Promise<void> {
  await database.execAsync(`
    -- Enable WAL mode for faster writing and better performance
    PRAGMA journal_mode = WAL;

    -- Table for storing classified notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      appName    TEXT NOT NULL DEFAULT '',
      title      TEXT,
      body       TEXT NOT NULL DEFAULT '',
      category   TEXT NOT NULL DEFAULT 'normal',
      isDelayed  INTEGER NOT NULL DEFAULT 0, 
      isRead     INTEGER NOT NULL DEFAULT 0,  
      confidence REAL DEFAULT 0.0,           
      createdAt  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- General key-value table for app settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    -- User-defined rules to force specific apps/contacts into categories
    CREATE TABLE IF NOT EXISTS rules (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      type           TEXT NOT NULL,
      value          TEXT NOT NULL,
      forcedCategory TEXT NOT NULL
    );

    -- Create indexes to make searching/sorting much faster
    CREATE INDEX IF NOT EXISTS idx_notifications_category ON notifications(category);
    CREATE INDEX IF NOT EXISTS idx_notifications_isDelayed ON notifications(isDelayed);
    CREATE INDEX IF NOT EXISTS idx_notifications_createdAt ON notifications(createdAt DESC);
  `);
}

// Helper function to check if Focus Mode is currently ON or OFF
export async function getFocusModeSetting(): Promise<boolean> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>(
    `SELECT value FROM settings WHERE key = 'focusMode'`,
  );
  return row?.value === "1"; // Return true if value is "1"
}

// Helper function to save the Focus Mode status (ON/OFF)
export async function setFocusModeSetting(value: boolean): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO settings (key, value) VALUES ('focusMode', ?)`,
    [value ? "1" : "0"], // Save as string "1" or "0"
  );
}
