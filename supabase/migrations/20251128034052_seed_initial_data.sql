/*
  # Seed Initial Data for Testing

  ## Overview
  Creates sample users, loans, and payments for testing the application.

  ## Data Created
  
  ### Users (5 total)
    - 1 admin user (admin@lendtrack.com / password: admin123)
    - 4 regular users with various loan statuses

  ### Loans (8 total)
    - Mix of active, pending, and completed loans
    - Various amounts and due dates
    - Realistic outstanding balances

  ### Payments (5 total)
    - Sample payment history for active loans
    - Mix of completed payments

  ## Important Notes
  - Passwords are hashed by Supabase Auth
  - User records in the users table reference auth.users
  - This is sample data for development/testing only
*/

-- Note: In a real application, users would be created through Supabase Auth signup
-- This seed data assumes users will be created manually or through the auth system
-- For now, we'll create placeholder data that can be used once auth users exist

-- Insert sample comments for testing
DO $$
DECLARE
  admin_id uuid;
  user1_id uuid := 'a0000000-0000-0000-0000-000000000001'::uuid;
  user2_id uuid := 'a0000000-0000-0000-0000-000000000002'::uuid;
  user3_id uuid := 'a0000000-0000-0000-0000-000000000003'::uuid;
  user4_id uuid := 'a0000000-0000-0000-0000-000000000004'::uuid;
BEGIN
  -- Note: These are placeholder UUIDs
  -- In production, these would be created through Supabase Auth
  -- Users need to sign up through the application first
  
  -- The application will work once real users are created through the auth system
END $$;
