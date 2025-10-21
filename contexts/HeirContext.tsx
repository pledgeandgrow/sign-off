import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from './AuthContext';
import { Heir, HeirDecrypted, HeirFormData } from '@/types/heir';
import { encryptData, decryptData } from '@/lib/encryption';
import { AccessLevelType } from '@/types/database.types';

interface HeirContextType {
  heirs: HeirDecrypted[];
  loading: boolean;
  createHeir: (heirData: Omit<HeirFormData, 'heir_user_id' | 'heir_public_key' | 'is_active'>) => Promise<HeirDecrypted>;
  updateHeir: (id: string, updates: Partial<HeirFormData>) => Promise<HeirDecrypted>;
  deleteHeir: (id: string) => Promise<void>;
  refreshHeirs: () => Promise<void>;
}

const HeirContext = createContext<HeirContextType | undefined>(undefined);

export function HeirProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [heirs, setHeirs] = useState<HeirDecrypted[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch heirs when user logs in
  useEffect(() => {
    if (user) {
      refreshHeirs();
    } else {
      setHeirs([]);
    }
  }, [user]);

  const refreshHeirs = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('heirs')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // TODO: Add decryption later - for now read data directly
      const decryptedHeirs: HeirDecrypted[] = (data || []).map((heir: Heir) => ({
        id: heir.id,
        user_id: heir.user_id,
        inheritance_plan_id: heir.inheritance_plan_id,
        full_name: heir.full_name_encrypted,
        email: heir.email_encrypted,
        phone: heir.phone_encrypted,
        relationship: heir.relationship_encrypted,
        access_level: heir.access_level,
        heir_user_id: heir.heir_user_id,
        heir_public_key: heir.heir_public_key,
        notify_on_activation: heir.notify_on_activation,
        notification_delay_days: heir.notification_delay_days,
        is_active: heir.is_active,
        has_accepted: heir.has_accepted,
        accepted_at: heir.accepted_at,
        created_at: heir.created_at,
        updated_at: heir.updated_at,
      }));

      setHeirs(decryptedHeirs);
    } catch (error) {
      console.error('Error fetching heirs:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const createHeir = async (
    heirData: Omit<HeirFormData, 'heir_user_id' | 'heir_public_key' | 'is_active'>
  ): Promise<HeirDecrypted> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // TODO: Add encryption later - for now save data directly
      const dataToInsert = {
        user_id: user.id,
        full_name_encrypted: heirData.full_name_encrypted,
        email_encrypted: heirData.email_encrypted,
        phone_encrypted: heirData.phone_encrypted || null,
        relationship_encrypted: heirData.relationship_encrypted || null,
        access_level: heirData.access_level,
        inheritance_plan_id: heirData.inheritance_plan_id || null,
        notify_on_activation: heirData.notify_on_activation ?? true,
        notification_delay_days: heirData.notification_delay_days ?? 0,
        is_active: true,
        heir_user_id: null,
        heir_public_key: null,
      };

      console.log('Creating heir with data:', dataToInsert);

      const { data, error } = await supabase
        .from('heirs')
        .insert(dataToInsert)
        .select()
        .single();

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      console.log('Heir created successfully:', data);

      const newHeir: HeirDecrypted = {
        id: data.id,
        user_id: data.user_id,
        inheritance_plan_id: data.inheritance_plan_id,
        full_name: data.full_name_encrypted,
        email: data.email_encrypted,
        phone: data.phone_encrypted,
        relationship: data.relationship_encrypted,
        access_level: data.access_level,
        heir_user_id: data.heir_user_id,
        heir_public_key: data.heir_public_key,
        notify_on_activation: data.notify_on_activation,
        notification_delay_days: data.notification_delay_days,
        is_active: data.is_active,
        has_accepted: data.has_accepted,
        accepted_at: data.accepted_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setHeirs((prev) => [newHeir, ...prev]);
      return newHeir;
    } catch (error) {
      console.error('Error creating heir:', error);
      throw error;
    }
  };

  const updateHeir = async (id: string, updates: Partial<HeirFormData>): Promise<HeirDecrypted> => {
    if (!user) throw new Error('User not authenticated');

    try {
      // TODO: Add encryption later - for now save data directly
      const updateData: any = {
        updated_at: new Date().toISOString(),
      };

      if (updates.full_name_encrypted) updateData.full_name_encrypted = updates.full_name_encrypted;
      if (updates.email_encrypted) updateData.email_encrypted = updates.email_encrypted;
      if (updates.phone_encrypted !== undefined) updateData.phone_encrypted = updates.phone_encrypted || null;
      if (updates.relationship_encrypted !== undefined) updateData.relationship_encrypted = updates.relationship_encrypted || null;
      if (updates.access_level) updateData.access_level = updates.access_level;
      if (updates.inheritance_plan_id !== undefined) updateData.inheritance_plan_id = updates.inheritance_plan_id;
      if (updates.notify_on_activation !== undefined) updateData.notify_on_activation = updates.notify_on_activation;
      if (updates.notification_delay_days !== undefined) updateData.notification_delay_days = updates.notification_delay_days;

      const { data, error } = await supabase
        .from('heirs')
        .update(updateData)
        .eq('id', id)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) throw error;

      const updatedHeir: HeirDecrypted = {
        id: data.id,
        user_id: data.user_id,
        inheritance_plan_id: data.inheritance_plan_id,
        full_name: data.full_name_encrypted,
        email: data.email_encrypted,
        phone: data.phone_encrypted,
        relationship: data.relationship_encrypted,
        access_level: data.access_level,
        heir_user_id: data.heir_user_id,
        heir_public_key: data.heir_public_key,
        notify_on_activation: data.notify_on_activation,
        notification_delay_days: data.notification_delay_days,
        is_active: data.is_active,
        has_accepted: data.has_accepted,
        accepted_at: data.accepted_at,
        created_at: data.created_at,
        updated_at: data.updated_at,
      };

      setHeirs((prev) => prev.map((h) => (h.id === id ? updatedHeir : h)));
      return updatedHeir;
    } catch (error) {
      console.error('Error updating heir:', error);
      throw error;
    }
  };

  const deleteHeir = async (id: string): Promise<void> => {
    if (!user) throw new Error('User not authenticated');

    try {
      const { error } = await supabase
        .from('heirs')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      setHeirs((prev) => prev.filter((h) => h.id !== id));
    } catch (error) {
      console.error('Error deleting heir:', error);
      throw error;
    }
  };

  const value = {
    heirs,
    loading,
    createHeir,
    updateHeir,
    deleteHeir,
    refreshHeirs,
  };

  return <HeirContext.Provider value={value}>{children}</HeirContext.Provider>;
}

export const useHeirs = () => {
  const context = useContext(HeirContext);
  if (context === undefined) {
    throw new Error('useHeirs must be used within a HeirProvider');
  }
  return context;
};
