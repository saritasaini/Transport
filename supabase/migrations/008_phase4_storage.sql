-- Phase 4: Storage setup for PODs and Receipts

-- Create buckets if they don't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('documents', 'documents', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('receipts', 'receipts', true)
ON CONFLICT (id) DO NOTHING;

-- Policies for documents (PODs)
CREATE POLICY "Public read access for documents" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'documents');

CREATE POLICY "Authenticated insert access for documents" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'documents' AND auth.role() = 'authenticated');

-- Policies for receipts (Expenses)
CREATE POLICY "Public read access for receipts" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'receipts');

CREATE POLICY "Authenticated insert access for receipts" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'receipts' AND auth.role() = 'authenticated');
