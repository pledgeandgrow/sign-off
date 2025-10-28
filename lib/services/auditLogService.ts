import { supabase } from '@/lib/supabase';

export type AuditAction = 
  | 'create' 
  | 'read' 
  | 'update' 
  | 'delete' 
  | 'login' 
  | 'logout' 
  | 'failed_login'
  | 'password_change'
  | 'vault_access'
  | 'vault_share'
  | 'inheritance_trigger'
  | 'heir_add'
  | 'heir_remove'
  | '2fa_enable'
  | '2fa_disable'
  | '2fa_verify';

export type ResourceType = 
  | 'user' 
  | 'vault' 
  | 'vault_item' 
  | 'inheritance_plan' 
  | 'heir' 
  | 'session'
  | '2fa';

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface AuditLogEntry {
  id?: string;
  user_id: string;
  action: AuditAction;
  resource_type: ResourceType;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  risk_level: RiskLevel;
  metadata?: Record<string, any>;
  created_at?: string;
}

/**
 * Create an audit log entry
 */
export async function createAuditLog(entry: Omit<AuditLogEntry, 'id' | 'created_at'>): Promise<void> {
  try {
    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: entry.user_id,
        action: entry.action,
        resource_type: entry.resource_type,
        resource_id: entry.resource_id,
        old_values: entry.old_values || null,
        new_values: entry.new_values || null,
        ip_address: entry.ip_address,
        user_agent: entry.user_agent,
        risk_level: entry.risk_level,
        metadata: entry.metadata || {},
      });

    if (error) {
      console.error('Error creating audit log:', error);
      // Don't throw - audit logging should not break the main flow
    }
  } catch (error) {
    console.error('Exception in createAuditLog:', error);
  }
}

/**
 * Get audit logs for a user
 */
export async function getUserAuditLogs(
  userId: string,
  limit: number = 50,
  offset: number = 0
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getUserAuditLogs:', error);
    return [];
  }
}

/**
 * Get audit logs by resource
 */
export async function getResourceAuditLogs(
  resourceType: ResourceType,
  resourceId: string,
  limit: number = 50
): Promise<AuditLogEntry[]> {
  try {
    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('resource_type', resourceType)
      .eq('resource_id', resourceId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching resource audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getResourceAuditLogs:', error);
    return [];
  }
}

/**
 * Get high-risk audit logs
 */
export async function getHighRiskAuditLogs(
  userId: string,
  days: number = 7
): Promise<AuditLogEntry[]> {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('audit_logs')
      .select('*')
      .eq('user_id', userId)
      .in('risk_level', ['high', 'critical'])
      .gte('created_at', cutoffDate.toISOString())
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching high-risk audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getHighRiskAuditLogs:', error);
    return [];
  }
}

/**
 * Log user activity (simplified audit log)
 */
export async function logUserActivity(
  userId: string,
  activityType: string,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const { error } = await supabase
      .from('user_activity')
      .insert({
        user_id: userId,
        activity_type: activityType,
        ip_address: metadata?.ip_address,
        user_agent: metadata?.user_agent,
        metadata: metadata || {},
      });

    if (error) {
      console.error('Error logging user activity:', error);
    }
  } catch (error) {
    console.error('Exception in logUserActivity:', error);
  }
}

/**
 * Get recent user activity
 */
export async function getRecentActivity(
  userId: string,
  limit: number = 20
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('user_activity')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception in getRecentActivity:', error);
    return [];
  }
}

/**
 * Helper function to determine risk level based on action
 */
export function getRiskLevel(action: AuditAction): RiskLevel {
  const highRiskActions: AuditAction[] = [
    'delete',
    'password_change',
    'vault_share',
    'inheritance_trigger',
    'heir_remove',
    '2fa_disable',
  ];

  const criticalRiskActions: AuditAction[] = [
    'failed_login',
  ];

  if (criticalRiskActions.includes(action)) {
    return 'critical';
  }

  if (highRiskActions.includes(action)) {
    return 'high';
  }

  if (action === 'create' || action === 'update') {
    return 'medium';
  }

  return 'low';
}
