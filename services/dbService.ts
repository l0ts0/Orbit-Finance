import { supabase } from './supabaseClient';
import { Holding, Transaction, CategoryDef } from '../types';

// Map DB snake_case to app camelCase
const mapHoldingFromDB = (h: any): Holding => ({
  id: h.id,
  name: h.name,
  ticker: h.ticker,
  type: h.type,
  price: Number(h.price),
  quantity: Number(h.quantity),
  currency: h.currency,
  color: h.color,
  change24h: 0, // Calculated dynamically via API usually, defaulting to 0 from DB
  billDay: h.bill_day,
  lastUpdated: h.last_updated ? new Date(h.last_updated).getTime() : undefined
});

const mapTransactionFromDB = (t: any): Transaction => ({
  id: t.id,
  type: t.type,
  date: t.date,
  amount: Number(t.amount),
  category: t.category,
  note: t.note,
  sourceAssetId: t.source_asset_id,
  sourceAssetName: t.source_asset_name
});

const mapCategoryFromDB = (c: any): CategoryDef => ({
  id: c.id,
  label: c.label,
  icon: c.icon,
  color: c.color,
  keywords: c.keywords || []
});

export const dbService = {
  // --- FETCH ALL DATA ---
  async fetchUserData(userId: string) {
    if (!supabase) return null;

    const { data: holdings } = await supabase.from('holdings').select('*').eq('user_id', userId);
    const { data: transactions } = await supabase.from('transactions').select('*').eq('user_id', userId).order('date', { ascending: false });
    const { data: categories } = await supabase.from('categories').select('*').eq('user_id', userId);

    return {
      holdings: holdings?.map(mapHoldingFromDB) || [],
      transactions: transactions?.map(mapTransactionFromDB) || [],
      categories: categories?.map(mapCategoryFromDB) || []
    };
  },

  // --- HOLDINGS ---
  async addHolding(userId: string, h: Partial<Holding>) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('holdings').insert({
      user_id: userId,
      name: h.name,
      ticker: h.ticker,
      type: h.type,
      price: h.price,
      quantity: h.quantity,
      currency: h.currency,
      color: h.color,
      bill_day: h.billDay,
      last_updated: h.lastUpdated ? new Date(h.lastUpdated).toISOString() : null
    }).select().single();
    if (error) console.error('Error adding holding:', error);
    return data ? mapHoldingFromDB(data) : null;
  },

  async updateHolding(id: string, updates: Partial<Holding>) {
    if (!supabase) return;
    const dbUpdates: any = { ...updates };
    if (updates.billDay !== undefined) dbUpdates.bill_day = updates.billDay;
    if (updates.lastUpdated !== undefined) dbUpdates.last_updated = new Date(updates.lastUpdated).toISOString();
    
    // Remove client-only fields that aren't in DB if necessary (e.g. change24h is usually not stored but fetched live)
    delete dbUpdates.id;
    delete dbUpdates.change24h;
    delete dbUpdates.billDay;
    delete dbUpdates.lastUpdated;

    const { error } = await supabase.from('holdings').update(dbUpdates).eq('id', id);
    if (error) console.error('Error updating holding:', error);
  },

  async deleteHolding(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('holdings').delete().eq('id', id);
    if (error) console.error('Error deleting holding:', error);
  },

  // --- TRANSACTIONS ---
  async addTransaction(userId: string, t: Partial<Transaction>) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('transactions').insert({
      user_id: userId,
      type: t.type,
      date: t.date,
      amount: t.amount,
      category: t.category,
      note: t.note,
      source_asset_id: t.sourceAssetId,
      source_asset_name: t.sourceAssetName
    }).select().single();
    if (error) console.error('Error adding transaction:', error);
    return data ? mapTransactionFromDB(data) : null;
  },

  async updateTransaction(id: string, updates: Partial<Transaction>) {
    if (!supabase) return;
    const dbUpdates: any = { ...updates };
    if (updates.sourceAssetId !== undefined) dbUpdates.source_asset_id = updates.sourceAssetId;
    if (updates.sourceAssetName !== undefined) dbUpdates.source_asset_name = updates.sourceAssetName;
    
    delete dbUpdates.id;
    delete dbUpdates.sourceAssetId;
    delete dbUpdates.sourceAssetName;

    const { error } = await supabase.from('transactions').update(dbUpdates).eq('id', id);
    if (error) console.error('Error updating transaction:', error);
  },

  async deleteTransaction(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (error) console.error('Error deleting transaction:', error);
  },

  // --- CATEGORIES ---
  async addCategory(userId: string, c: Partial<CategoryDef>) {
    if (!supabase) return null;
    const { data, error } = await supabase.from('categories').insert({
      user_id: userId,
      label: c.label,
      icon: c.icon,
      color: c.color,
      keywords: c.keywords
    }).select().single();
    if (error) console.error('Error adding category:', error);
    return data ? mapCategoryFromDB(data) : null;
  },

  async updateCategory(id: string, updates: Partial<CategoryDef>) {
    if (!supabase) return;
    const { error } = await supabase.from('categories').update(updates).eq('id', id);
    if (error) console.error('Error updating category:', error);
  },

  async deleteCategory(id: string) {
    if (!supabase) return;
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) console.error('Error deleting category:', error);
  }
};