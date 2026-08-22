UPDATE auth.users
SET raw_user_meta_data = raw_user_meta_data || '{"role":"admin","whatsapp_access":true}'::jsonb
WHERE id = '7a382b68-c400-4223-aac2-305f5446a155'
RETURNING email, raw_user_meta_data;
