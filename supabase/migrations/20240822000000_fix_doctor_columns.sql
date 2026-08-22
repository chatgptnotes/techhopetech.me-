-- Fix doctor registry table: Add missing columns and fix RLS policies

-- Add missing columns
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS email VARCHAR(255);
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Fix RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert" ON referral_doctor_whatsapp_registry;
CREATE POLICY "Authenticated users can insert" ON referral_doctor_whatsapp_registry FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can select" ON referral_doctor_whatsapp_registry;
CREATE POLICY "Authenticated users can select" ON referral_doctor_whatsapp_registry FOR SELECT USING (auth.uid() IS NOT NULL);