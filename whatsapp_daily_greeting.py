#!/usr/bin/env python3
"""
HopeTech CRM - Daily Good Morning WhatsApp Worker
Sends automated Good Morning messages to referral doctors every day at 8:00 AM
"""

import os
import sys
import json
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

SUPABASE_URL = os.environ.get("SUPABASE_URL")
SUPABASE_KEY = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
DOUBLETICK_API_KEY = os.environ.get("DOUBLETICK_API_KEY")
DOUBLETICK_API_URL = os.environ.get("DOUBLETICK_API_URL", "https://public.doubletick.io/whatsapp/message/template")
TEMPLATE_NAME = os.environ.get("GOOD_MORNING_TEMPLATE_NAME", "_good_morning_hope_hospital")

def get_active_doctors():
    """Fetch all doctors with WhatsApp enabled"""
    url = f"{SUPABASE_URL}/rest/v1/referral_doctor_whatsapp_registry"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }
    params = {
        "whatsapp_enabled": "eq.true",
        "select": "*"
    }

    response = requests.get(url, headers=headers, params=params)
    if response.status_code == 200:
        return response.json()
    else:
        print(f"Error fetching doctors: {response.status_code}", file=sys.stderr)
        return []

def queue_goodmorning_message(doctor):
    """Queue Good Morning message for a doctor"""
    url = f"{SUPABASE_URL}/rest/v1/whatsapp_message_queue"
    headers = {
        "apikey": SUPABASE_KEY,
        "Authorization": f"Bearer {SUPABASE_KEY}",
        "Content-Type": "application/json"
    }

    # Schedule for today at 8:00 AM
    now = datetime.now()
    scheduled_time = now.replace(hour=8, minute=0, second=0, microsecond=0)
    if scheduled_time < now:
        scheduled_time += timedelta(days=1)  # Schedule for tomorrow if 8 AM has passed

    message_data = {
        "campaign_type": "daily_greeting",
        "doctor_id": doctor["id"],
        "phone_number": doctor["whatsapp_number"],
        "template_name": TEMPLATE_NAME,
        "template_variables": {"doctor_name": doctor["doctor_name"]},
        "scheduled_for": scheduled_time.isoformat(),
        "status": "pending"
    }

    response = requests.post(url, headers=headers, json=message_data)
    return response.status_code == 201

def send_whatsapp_via_doubletick(phone_number, doctor_name):
    """Send WhatsApp message via Doubletick API"""
    # Format phone number
    formatted_phone = phone_number.replace("+", "").replace(" ", "")

    payload = {
        "messages": [{
            "to": formatted_phone,
            "content": {
                "templateName": TEMPLATE_NAME,
                "language": "en",
                "templateData": {
                    "body": {
                        "placeholders": [doctor_name]
                    }
                }
            }
        }]
    }

    headers = {
        "accept": "application/json",
        "content-type": "application/json",
        "Authorization": DOUBLETICK_API_KEY
    }

    try:
        response = requests.post(DOUBLETICK_API_URL, headers=headers, json=payload, timeout=30)
        return response.json(), response.status_code
    except Exception as e:
        return {"error": str(e)}, 500

def main():
    """Main execution function"""
    print(f"[{datetime.now()}] Starting Daily Good Morning WhatsApp Worker")

    # Get all active doctors
    doctors = get_active_doctors()
    print(f"Found {len(doctors)} doctors with WhatsApp enabled")

    success_count = 0
    error_count = 0

    for doctor in doctors:
        try:
            # Send message via Doubletick
            result, status_code = send_whatsapp_via_doubletick(
                doctor["whatsapp_number"],
                doctor["doctor_name"]
            )

            if status_code == 200:
                # Update message queue status
                success_count += 1
                print(f"✓ Sent to Dr. {doctor['doctor_name']} ({doctor['whatsapp_number']})")

                # Update doctor stats
                # (Add database update logic here)
            else:
                error_count += 1
                print(f"✗ Failed for Dr. {doctor['doctor_name']}: {result.get('error', 'Unknown error')}")

        except Exception as e:
            error_count += 1
            print(f"✗ Error for Dr. {doctor['doctor_name']}: {str(e)}", file=sys.stderr)

    print(f"[{datetime.now()}] Daily Good Morning completed: {success_count} sent, {error_count} failed")

if __name__ == "__main__":
    main()