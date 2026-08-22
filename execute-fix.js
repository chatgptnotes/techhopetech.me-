console.log('=== SQL EXECUTION INSTRUCTIONS ===\n');
console.log('Copy and paste this SQL into your Supabase SQL Editor:');
console.log('https://supabase.com/dashboard → SQL Editor → New Query\n');
console.log('----------------------------------------');
console.log(`-- Fix doctor registry table: Add missing columns and fix RLS policies

-- Add missing columns
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS phone VARCHAR(20);
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS qualification VARCHAR(255);
ALTER TABLE referral_doctor_whatsapp_registry ADD COLUMN IF NOT EXISTS department VARCHAR(255);

-- Fix RLS policies
DROP POLICY IF EXISTS "Authenticated users can insert" ON referral_doctor_whatsapp_registry;
CREATE POLICY "Authenticated users can insert" ON referral_doctor_whatsapp_registry FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Authenticated users can select" ON referral_doctor_whatsapp_registry;
CREATE POLICY "Authenticated users can select" ON referral_doctor_whatsapp_registry FOR SELECT USING (auth.uid() IS NOT NULL);`);
console.log('----------------------------------------\n');
console.log('After running this SQL, test at:');
console.log('http://localhost:3003/whatsapp-communication/dashboard');