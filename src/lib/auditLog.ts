import { supabase } from './supabase';

export type AuditActionType =
  | 'payment_marked_paid'
  | 'payment_reversed'
  | 'loan_approved'
  | 'loan_rejected'
  | 'loan_created'
  | 'bulk_payments_marked_paid'
  | 'bulk_payments_reversed'
  | 'user_created'
  | 'user_updated';

export type AuditTargetType = 'loan' | 'payment' | 'user' | 'bulk';

interface LogAuditParams {
  actorId: string;
  actionType: AuditActionType;
  targetId: string;
  targetType: AuditTargetType;
  oldValue?: Record<string, unknown>;
  newValue?: Record<string, unknown>;
  reason?: string;
  metadata?: Record<string, unknown>;
}

export async function logAudit({
  actorId,
  actionType,
  targetId,
  targetType,
  oldValue,
  newValue,
  reason,
  metadata = {},
}: LogAuditParams): Promise<void> {
  try {
    const { error } = await supabase.from('audit_logs').insert({
      actor_id: actorId,
      action_type: actionType,
      target_id: targetId,
      target_type: targetType,
      old_value: oldValue || null,
      new_value: newValue || null,
      reason: reason || null,
      metadata,
    });

    if (error) {
      console.error('Failed to log audit entry:', error);
    }
  } catch (err) {
    console.error('Error logging audit:', err);
  }
}

export async function getAuditLogs(filters?: {
  actorId?: string;
  actionType?: string;
  targetType?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
}) {
  let query = supabase
    .from('audit_logs')
    .select(`
      *,
      actor:users!audit_logs_actor_id_fkey(id, full_name, email)
    `)
    .order('created_at', { ascending: false });

  if (filters?.actorId) {
    query = query.eq('actor_id', filters.actorId);
  }

  if (filters?.actionType) {
    query = query.eq('action_type', filters.actionType);
  }

  if (filters?.targetType) {
    query = query.eq('target_type', filters.targetType);
  }

  if (filters?.startDate) {
    query = query.gte('created_at', filters.startDate);
  }

  if (filters?.endDate) {
    query = query.lte('created_at', filters.endDate);
  }

  if (filters?.limit) {
    query = query.limit(filters.limit);
  }

  const { data, error } = await query;

  if (error) throw error;
  return data;
}
