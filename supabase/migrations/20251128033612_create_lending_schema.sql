/*
  # Money Lending Management System - Initial Schema

  ## Overview
  Creates the core tables for a money lending management system with user and admin roles.

  ## Tables Created
  
  ### 1. users (extends auth.users)
    - `id` (uuid, FK to auth.users)
    - `email` (text)
    - `full_name` (text)
    - `phone` (text)
    - `role` (text) - 'user' or 'admin'
    - `outstanding_balance` (decimal) - current total owed
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 2. loans
    - `id` (uuid, PK)
    - `user_id` (uuid, FK to users)
    - `amount` (decimal) - original loan amount
    - `outstanding_amount` (decimal) - remaining balance
    - `interest_rate` (decimal) - percentage
    - `status` (text) - 'pending', 'active', 'completed', 'rejected'
    - `requested_at` (timestamptz)
    - `approved_at` (timestamptz)
    - `approved_by` (uuid, FK to users)
    - `due_date` (date)
    - `created_at` (timestamptz)
    - `updated_at` (timestamptz)

  ### 3. payments
    - `id` (uuid, PK)
    - `loan_id` (uuid, FK to loans)
    - `user_id` (uuid, FK to users)
    - `amount` (decimal)
    - `transaction_id` (text)
    - `status` (text) - 'completed', 'reversed'
    - `processed_by` (uuid, FK to users) - admin who processed
    - `reversal_reason` (text)
    - `reversed_at` (timestamptz)
    - `created_at` (timestamptz)

  ### 4. comments
    - `id` (uuid, PK)
    - `user_id` (uuid, FK to users)
    - `loan_id` (uuid, FK to loans, nullable)
    - `message` (text)
    - `created_at` (timestamptz)

  ## Security
  - RLS enabled on all tables
  - Users can read their own data
  - Admins can read/write all data
  - All policies check authentication and role-based access
*/

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  full_name text NOT NULL,
  phone text,
  role text NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  outstanding_balance decimal(12,2) DEFAULT 0.00,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all users"
  ON users FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can update own profile"
  ON users FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Admins can update all users"
  ON users FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create loans table
CREATE TABLE IF NOT EXISTS loans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  outstanding_amount decimal(12,2) NOT NULL CHECK (outstanding_amount >= 0),
  interest_rate decimal(5,2) DEFAULT 0.00,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
  requested_at timestamptz DEFAULT now(),
  approved_at timestamptz,
  approved_by uuid REFERENCES users(id),
  due_date date,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE loans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own loans"
  ON loans FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all loans"
  ON loans FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create loan requests"
  ON loans FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid() AND status = 'pending');

CREATE POLICY "Admins can update loans"
  ON loans FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create payments table
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  loan_id uuid NOT NULL REFERENCES loans(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount decimal(12,2) NOT NULL CHECK (amount > 0),
  transaction_id text NOT NULL,
  status text NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'reversed')),
  processed_by uuid REFERENCES users(id),
  reversal_reason text,
  reversed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own payments"
  ON payments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all payments"
  ON payments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can create payments"
  ON payments FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Admins can update payments"
  ON payments FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Create comments table
CREATE TABLE IF NOT EXISTS comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  loan_id uuid REFERENCES loans(id) ON DELETE CASCADE,
  message text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own comments"
  ON comments FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all comments"
  ON comments FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

CREATE POLICY "Users can create comments"
  ON comments FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_loans_user_id ON loans(user_id);
CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
CREATE INDEX IF NOT EXISTS idx_payments_loan_id ON payments(loan_id);
CREATE INDEX IF NOT EXISTS idx_payments_user_id ON payments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_user_id ON comments(user_id);
CREATE INDEX IF NOT EXISTS idx_comments_loan_id ON comments(loan_id);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_loans_updated_at BEFORE UPDATE ON loans
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();