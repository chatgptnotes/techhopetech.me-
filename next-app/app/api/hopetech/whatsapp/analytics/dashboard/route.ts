import { NextResponse } from 'next/server';
import { db } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // Get total doctors with WhatsApp enabled
    const { count: totalDoctors } = await db
      .from('referral_doctor_whatsapp_registry')
      .select('*', { count: 'exact', head: true })
      .eq('whatsapp_enabled', true);

    // Get messages sent today
    const today = new Date().toISOString().split('T')[0];
    const { count: messagesToday } = await db
      .from('whatsapp_message_queue')
      .select('*', { count: 'exact', head: true })
      .gte('sent_at', today)
      .eq('status', 'sent');

    // Get scheduled messages
    const { count: scheduledMessages } = await db
      .from('whatsapp_message_queue')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    // Calculate delivery rate
    const { data: allMessages } = await db
      .from('whatsapp_message_queue')
      .select('status')
      .gte('created_at', today);

    const deliveryRate = allMessages && allMessages.length > 0
      ? ((allMessages.filter(m => m.status === 'sent' || m.status === 'delivered').length / allMessages.length) * 100).toFixed(1)
      : '0.0';

    return NextResponse.json({
      totalDoctors: totalDoctors || 0,
      messagesToday: messagesToday || 0,
      scheduledMessages: scheduledMessages || 0,
      deliveryRate: parseFloat(deliveryRate)
    });

  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    return NextResponse.json({
      totalDoctors: 0,
      messagesToday: 0,
      scheduledMessages: 0,
      deliveryRate: 0
    });
  }
}