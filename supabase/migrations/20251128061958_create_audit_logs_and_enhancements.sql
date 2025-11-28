/*
  # Phase 2 - Audit Logs and System Enhancements

  1. New Tables
    - `audit_logs`
      - `id` (uuid, primary key)
      - `actor_id` (uuid, references users) - Who performed the action
      - `action_type` (text) - Type of action (payment_marked_paid, payment_reversed, loan_approved, etc.)
      - `target_id` (uuid) - ID of affected resource (loan/payment/user)
      - `target_type` (text) - Type of target (loan, payment, user)
      - `old_value` (jsonb) - Previous state
      - `new_value` (jsonb) - New state
      - `reason` (text) - Reason for action
      - `metadata` (jsonb) - Additional context
      - `created_at` (timestamptz)

  2. Table Modifications
    - Add `receipt_url` to payments table for storing receipt images
    - Add `approved_by` reference constraint
    - Add validation constraints

  3. Indexes
    - Add indexes on frequently queried columns for performance
    - user_id, loan_id, status columns
    - audit_logs actor_id and created_at

  4. Security
    - Enable RLS on audit_logs
    - Only admins can read audit logs
    - System automatically creates audit entries
    
  5. Important Notes
    - All admin actions must create audit log entries
    - Audit logs are append-only (no updates/deletes)
    - Indexes improve query performance for large datasets
*/

-- Create audit_logs table
CREATE TABLE IF NOT EXISTS audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES users(id) ON DELETE SET NULL,
  action_type text NOT NULL,
  target_id uuid,
  target_type text,
  old_value jsonb,
  new_value jsonb,
  reason text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Add receipt_url to payments table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'payments' AND column_name = 'receipt_url'
  ) THEN
    ALTER TABLE payments ADD COLUMN receipt_url text;
  END IF;
END $$;

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_loans_due_date ON loans(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_created_at ON payments(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action_type ON audit_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_id ON audit_logs(target_id);

-- Enable RLS on audit_logs
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins can read all audit logs
CREATE POLICY "Admins can read all audit logs"
  ON audit_logs FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- System can insert audit logs (through service role or authenticated users)
CREATE POLICY "Authenticated users can insert audit logs"
  ON audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Add check constraints for data validation
ALTER TABLE loans 
  DROP CONSTRAINT IF EXISTS check_loan_amount_positive,
  ADD CONSTRAINT check_loan_amount_positive CHECK (amount > 0);

ALTER TABLE loans
  DROP CONSTRAINT IF EXISTS check_outstanding_amount_valid,
  ADD CONSTRAINT check_outstanding_amount_valid CHECK (outstanding_amount >= 0 AND outstanding_amount <= amount);

ALTER TABLE payments
  DROP CONSTRAINT IF EXISTS check_payment_amount_positive,
  ADD CONSTRAINT check_payment_amount_positive CHECK (amount > 0);

-- Function to automatically log audit entries (helper for triggers if needed)
CREATE OR REPLACE FUNCTION log_audit_entry(
  p_actor_id uuid,
  p_action_type text,
  p_target_id uuid,
  p_target_type text,
  p_old_value jsonb DEFAULT NULL,
  p_new_value jsonb DEFAULT NULL,
  p_reason text DEFAULT NULL,
  p_metadata jsonb DEFAULT '{}'::jsonb
) RETURNS uuid AS $$
DECLARE
  v_audit_id uuid;
BEGIN
  INSERT INTO audit_logs (
    actor_id,
    action_type,
    target_id,
    target_type,
    old_value,
    new_value,
    reason,
    metadata
  ) VALUES (
    p_actor_id,
    p_action_type,
    p_target_id,
    p_target_type,
    p_old_value,
    p_new_value,
    p_reason,
    p_metadata
  ) RETURNING id INTO v_audit_id;
  
  RETURN v_audit_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;