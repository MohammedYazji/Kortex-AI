// Defines the priority levels for notification classification.
export type Category = "urgent" | "normal" | "noise";

// Defines the criteria types for user-defined filtering rules.
export type RuleType = "contact" | "app";

// Represents a single notification entity within the system.
export interface Notification {
  id: number;
  title: string | null;
  body: string;
  appName: string;
  category: Category;
  // Represented as 0 or 1 for SQLite compatibility
  isDelayed: number;
  // Represented as 0 or 1 for SQLite compatibility
  isRead: number;
  createdAt: string;
}

// User-defined preference to override AI classification for specific inputs.
export interface Rule {
  id: number;
  type: RuleType;
  // The specific contact name or package name to target
  value: string;
  // The category to apply regardless of AI inference
  forcedCategory: Category;
}

// Aggregated statistics for notification distribution.
export interface AppStats {
  urgent: number;
  normal: number;
  noise: number;
  delayed: number;
  total: number;
}

// The direct output from the AI model inference.
export interface ClassificationResult {
  category: Category;
  confidence: number;
}

// API/Service response structure for grouped notification feeds.
export interface CategorizedResponse {
  urgent: { data: Notification[]; count: number };
  normal: { data: Notification[]; count: number };
  noise: { data: Notification[]; count: number };
  totalCount: number;
}

// Data structure optimized for Dashboard visualizations and charts.
export interface StatsResponse {
  distribution: { label: Category; value: number }[];
  totalSaved: number;
  topDistractors: { appName: string; noiseCount: number }[];
  estimatedFocusTime: number;
}
