export type Purchase = {
  id: string;
  user_id: string;
  event_name: string;
  event_date: string;
  venue: string | null;
  city: string | null;
  event_actual_date: string | null;
  sector: string | null;
  exchange: string | null;
  delivered: boolean;
  paid_out: boolean;
  notes: string | null;
  tags: string[];
  quantity: number;
  quantity_remaining: number;
  buy_price: number;
  total_cost: number;
  currency: string;
  platform_id: string | null;
  account_ref: string | null;
  status: string;
  created_at: string;
  platforms?: { name: string } | null;
};

export type Sale = {
  id: string;
  user_id: string;
  purchase_id: string;
  quantity_sold: number;
  sell_price: number;
  currency: string;
  platform_id: string | null;
  fees: number;
  sold_at: string;
  payout_at: string | null;
};

export type Platform = {
  id: string;
  name: string;
  slug: string;
  fee_percent: number;
  fee_fixed: number;
  currency_default: string;
  is_active: boolean;
  logo_url: string | null;
};

export type Expense = {
  id: string;
  user_id: string;
  category: string;
  amount: number;
  currency: string;
  recurring: boolean;
  description: string | null;
  date: string;
  purchase_id: string | null;
};

export type UserProfile = {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  preferred_currency: string;
  locale: string;
  timezone: string;
  created_at: string;
};
