/**
 * Doubletick WhatsApp API Service for HopeTech CRM
 * Handles template creation, message sending, and delivery tracking
 */

const DOUBLETICK_API_URL = process.env.DOUBLETICK_API_URL || 'https://public.doubletick.io/whatsapp/message/template';
const DOUBLETICK_API_KEY = process.env.DOUBLETICK_API_KEY;
const FROM_NUMBER = process.env.DOUBLETICK_FROM_NUMBER || '';

export interface DoubletickMessage {
  to: string;           // Phone number with country code (e.g., +917030974619)
  from?: string;        // Optional sender number
  templateName: string; // Template name (e.g., "_good_morning_hope_hospital")
  language: string;     // Template language (e.g., "en")
  placeholders?: string[]; // Template variables (e.g., ["Dr. Sharma"])
}

export interface DoubletickResponse {
  success: boolean;
  messageId?: string;
  error?: string;
  status?: string;
}

/**
 * Send WhatsApp message using Doubletick template
 */
export async function sendWhatsAppTemplate(message: DoubletickMessage): Promise<DoubletickResponse> {
  try {
    if (!DOUBLETICK_API_KEY) {
      throw new Error('DOUBLETICK_API_KEY not configured in environment variables');
    }

    const payload = {
      messages: [{
        to: message.to.replace(/\s+/g, ''), // Remove spaces from phone number
        from: message.from || FROM_NUMBER,
        content: {
          templateName: message.templateName,
          language: message.language || 'en',
          templateData: {
            body: {
              placeholders: message.placeholders || []
            }
          }
        }
      }]
    };

    const response = await fetch(DOUBLETICK_API_URL, {
      method: 'POST',
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'Authorization': DOUBLETICK_API_KEY
      },
      body: JSON.stringify(payload)
    });

    const data = await response.json();

    if (response.ok) {
      return {
        success: true,
        messageId: data.messageId || data.id,
        status: 'sent'
      };
    } else {
      return {
        success: false,
        error: data.error || data.message || 'Failed to send WhatsApp message'
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Send Good Morning message to a doctor
 */
export async function sendGoodMorningMessage(doctorName: string, phoneNumber: string): Promise<DoubletickResponse> {
  const templateName = process.env.GOOD_MORNING_TEMPLATE_NAME || '_good_morning_hope_hospital';

  // Format phone number (ensure it starts with + and remove spaces)
  const formattedPhone = phoneNumber.startsWith('+')
    ? phoneNumber.replace(/\s+/g, '')
    : `+${phoneNumber.replace(/\s+/g, '')}`;

  return sendWhatsAppTemplate({
    to: formattedPhone,
    templateName: templateName,
    language: 'en',
    placeholders: [doctorName]
  });
}

/**
 * Send bulk Good Morning messages to multiple doctors
 */
export async function sendBulkGoodMorningMessages(doctors: Array<{name: string, phone: string}>): Promise<DoubletickResponse[]> {
  const promises = doctors.map(doctor =>
    sendGoodMorningMessage(doctor.name, doctor.phone)
  );

  return Promise.all(promises);
}

/**
 * Validate Doubletick API configuration
 */
export function validateDoubletickConfig(): {valid: boolean; error?: string} {
  if (!DOUBLETICK_API_KEY) {
    return { valid: false, error: 'DOUBLETICK_API_KEY not configured' };
  }

  if (!DOUBLETICK_API_URL) {
    return { valid: false, error: 'DOUBLETICK_API_URL not configured' };
  }

  return { valid: true };
}