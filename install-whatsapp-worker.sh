#!/bin/bash
# Installation script for WhatsApp Daily Greeting Worker

INSTALL_DIR="/usr/local/bin"
WORKER_NAME="whatsapp_daily_greeting.py"
SERVICE_NAME="whatsapp-worker"
LOG_FILE="/var/log/whatsapp-worker.log"

echo "Installing WhatsApp Daily Greeting Worker..."

# Copy worker to installation directory
cp "$WORKER_NAME" "$INSTALL_DIR/$WORKER_NAME"
chmod +x "$INSTALL_DIR/$WORKER_NAME"

# Create systemd service
cat > "/etc/systemd/system/$SERVICE_NAME.service" << EOF
[Unit]
Description=WhatsApp Daily Greeting Worker
After=network.target

[Service]
Type=oneshot
User=root
WorkingDirectory=/root
ExecStart=/usr/bin/python3 $INSTALL_DIR/$WORKER_NAME
StandardOutput=append:$LOG_FILE
StandardError=append:$LOG_FILE

[Install]
WantedBy=multi-user.target
EOF

# Create timer for daily execution at 8:00 AM
cat > "/etc/systemd/system/$SERVICE_NAME.timer" << EOF
[Unit]
Description=WhatsApp Daily Greeting Timer
Requires=$SERVICE_NAME.service

[Timer]
OnCalendar=*-*-* 08:00:00
Persistent=true

[Install]
WantedBy=timers.target
EOF

# Reload systemd and enable service
systemctl daemon-reload
systemctl enable $SERVICE_NAME.timer
systemctl start $SERVICE_NAME.timer

echo "WhatsApp Worker installed and scheduled for daily 8:00 AM execution"
echo "Logs will be written to: $LOG_FILE"
echo "Check status with: systemctl status $SERVICE_NAME.timer"