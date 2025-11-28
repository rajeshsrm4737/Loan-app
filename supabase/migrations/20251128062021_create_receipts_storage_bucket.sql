/*
  # Create Storage Bucket for Payment Receipts

  1. Storage Setup
    - Create 'receipts' bucket for payment receipt images
    - Set up RLS policies for secure access
    
  2. Security
    - Admins can upload receipts
    - Users can view their own receipts
    - Authenticated users can read receipts they're authorized for
    
  3. Important Notes
    - File size limits handled by Supabase Storage
    - Supported formats: images (jpg, png, pdf)
    - Files organized by payment ID
*/

-- Create receipts storage bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('receipts', 'receipts', false)
ON CONFLICT (id) DO NOTHING;

-- Allow admins to upload receipts
CREATE POLICY "Admins can upload receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow admins to read all receipts
CREATE POLICY "Admins can read all receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );

-- Allow users to read their own payment receipts
CREATE POLICY "Users can read their own receipts"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM payments
      WHERE payments.user_id = auth.uid()
      AND payments.receipt_url LIKE '%' || storage.objects.name || '%'
    )
  );

-- Allow admins to delete receipts
CREATE POLICY "Admins can delete receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'receipts' AND
    EXISTS (
      SELECT 1 FROM users
      WHERE users.id = auth.uid()
      AND users.role = 'admin'
    )
  );