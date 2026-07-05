-- Phase 2: Trips extensions, GST, and POD tracking

-- 1. Add fields to `trips` table
ALTER TABLE trips 
ADD COLUMN IF NOT EXISTS eway_bill_no TEXT,
ADD COLUMN IF NOT EXISTS lr_number TEXT,
ADD COLUMN IF NOT EXISTS pod_received BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS pod_image_url TEXT;

-- 2. Add fields to `bills` table for GST compliance (SAC 9965)
ALTER TABLE bills 
ADD COLUMN IF NOT EXISTS transporter_gstin TEXT,
ADD COLUMN IF NOT EXISTS customer_gstin TEXT,
ADD COLUMN IF NOT EXISTS cgst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS sgst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS igst_amount NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_reverse_charge BOOLEAN DEFAULT false;
