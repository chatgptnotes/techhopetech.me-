-- HopeTech Tablet CRM Database Schema
-- This script sets up all tables for the tablet marketing and CRM system

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Marketing Employees (Users)
CREATE TABLE IF NOT EXISTS marketing_employees (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20),
    designation VARCHAR(100),
    department VARCHAR(100),
    status VARCHAR(50) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Daily Visit Plans
CREATE TABLE IF NOT EXISTS daily_visit_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES marketing_employees(id),
    plan_date DATE NOT NULL,
    planned_visits INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, plan_date)
);

-- Doctor Visits
CREATE TABLE IF NOT EXISTS doctor_visits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_id UUID REFERENCES daily_visit_plans(id),
    employee_id UUID REFERENCES marketing_employees(id),
    doctor_name VARCHAR(255) NOT NULL,
    hospital_clinic_name VARCHAR(255) NOT NULL,
    location VARCHAR(255),
    meeting_time TIMESTAMP WITH TIME ZONE,
    priority_level VARCHAR(50) DEFAULT 'medium',
    contact_phone VARCHAR(20),
    contact_email VARCHAR(255),
    remarks TEXT,
    status VARCHAR(50) DEFAULT 'planned',
    completion_time TIMESTAMP WITH TIME ZONE,
    visit_notes TEXT,
    outcome_summary TEXT,
    is_additional_visit BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Voice Notes
CREATE TABLE IF NOT EXISTS voice_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES doctor_visits(id),
    employee_id UUID REFERENCES marketing_employees(id),
    audio_url VARCHAR(500),
    transcription TEXT,
    duration INTEGER,
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Files (Photos/Videos)
CREATE TABLE IF NOT EXISTS visit_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES doctor_visits(id),
    employee_id UUID REFERENCES marketing_employees(id),
    media_type VARCHAR(50) NOT NULL,
    file_url VARCHAR(500) NOT NULL,
    thumbnail_url VARCHAR(500),
    file_size BIGINT,
    duration INTEGER,
    caption TEXT,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Follow-Up Tasks
CREATE TABLE IF NOT EXISTS follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    visit_id UUID REFERENCES doctor_visits(id),
    employee_id UUID REFERENCES marketing_employees(id),
    lead_id UUID,
    task_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    due_date TIMESTAMP WITH TIME ZONE,
    priority VARCHAR(50) DEFAULT 'medium',
    status VARCHAR(50) DEFAULT 'pending',
    completed_at TIMESTAMP WITH TIME ZONE,
    reminder_sent BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Leads
CREATE TABLE IF NOT EXISTS leads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES marketing_employees(id),
    lead_name VARCHAR(255) NOT NULL,
    organization_name VARCHAR(255),
    contact_person VARCHAR(255),
    mobile_number VARCHAR(20),
    email_address VARCHAR(255),
    location VARCHAR(255),
    lead_source VARCHAR(100),
    lead_type VARCHAR(100),
    status VARCHAR(50) DEFAULT 'new',
    assigned_to UUID REFERENCES marketing_employees(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Opportunities
CREATE TABLE IF NOT EXISTS opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    employee_id UUID REFERENCES marketing_employees(id),
    opportunity_name VARCHAR(255) NOT NULL,
    organization VARCHAR(255),
    expected_revenue DECIMAL(15,2),
    probability INTEGER,
    next_follow_up_date TIMESTAMP WITH TIME ZONE,
    assigned_executive UUID REFERENCES marketing_employees(id),
    status VARCHAR(50) DEFAULT 'open',
    description TEXT,
    closed_date DATE,
    actual_revenue DECIMAL(15,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Lead Activity History
CREATE TABLE IF NOT EXISTS lead_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES leads(id),
    opportunity_id UUID REFERENCES opportunities(id),
    employee_id UUID REFERENCES marketing_employees(id),
    activity_type VARCHAR(100) NOT NULL,
    activity_title VARCHAR(255) NOT NULL,
    description TEXT,
    activity_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES marketing_employees(id),
    notification_type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    related_visit_id UUID,
    related_follow_up_id UUID,
    related_lead_id UUID,
    is_read BOOLEAN DEFAULT FALSE,
    priority VARCHAR(50) DEFAULT 'normal',
    scheduled_for TIMESTAMP WITH TIME ZONE,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Performance Metrics (Daily Summary)
CREATE TABLE IF NOT EXISTS daily_performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id UUID REFERENCES marketing_employees(id),
    metric_date DATE NOT NULL,
    planned_visits INTEGER DEFAULT 0,
    completed_planned_visits INTEGER DEFAULT 0,
    additional_visits INTEGER DEFAULT 0,
    total_visits INTEGER DEFAULT 0,
    leads_generated INTEGER DEFAULT 0,
    opportunities_created INTEGER DEFAULT 0,
    follow_ups_pending INTEGER DEFAULT 0,
    follow_ups_completed INTEGER DEFAULT 0,
    productivity_score DECIMAL(5,2),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(employee_id, metric_date)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_doctor_visits_employee ON doctor_visits(employee_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_plan ON doctor_visits(plan_id);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_status ON doctor_visits(status);
CREATE INDEX IF NOT EXISTS idx_doctor_visits_date ON doctor_visits(meeting_time);

CREATE INDEX IF NOT EXISTS idx_leads_employee ON leads(employee_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_assigned ON leads(assigned_to);

CREATE INDEX IF NOT EXISTS idx_opportunities_employee ON opportunities(employee_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_lead ON opportunities(lead_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_status ON opportunities(status);

CREATE INDEX IF NOT EXISTS idx_follow_ups_employee ON follow_up_tasks(employee_id);
CREATE INDEX IF NOT EXISTS idx_follow_ups_status ON follow_up_tasks(status);
CREATE INDEX IF NOT EXISTS idx_follow_ups_due ON follow_up_tasks(due_date);

CREATE INDEX IF NOT EXISTS idx_notifications_employee ON notifications(employee_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_scheduled ON notifications(scheduled_for);

CREATE INDEX IF NOT EXISTS idx_daily_plan_employee ON daily_visit_plans(employee_id);
CREATE INDEX IF NOT EXISTS idx_daily_plan_date ON daily_visit_plans(plan_date);

-- Insert sample marketing employee
INSERT INTO marketing_employees (full_name, email, phone, designation, department, status)
VALUES
    ('Abhishek Kumar', 'abhishek@hopetech.me', '+91-9876543210', 'Marketing Executive', 'Sales & Marketing', 'active'),
    ('Priya Sharma', 'priya@hopetech.me', '+91-9876543211', 'Senior Marketing Executive', 'Sales & Marketing', 'active'),
    ('Rajesh Verma', 'rajesh@hopetech.me', '+91-9876543212', 'Marketing Manager', 'Sales & Marketing', 'active')
ON CONFLICT (email) DO NOTHING;

-- Create function to update performance metrics
CREATE OR REPLACE FUNCTION update_daily_performance_metrics()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO daily_performance_metrics (
        employee_id,
        metric_date,
        planned_visits,
        completed_planned_visits,
        additional_visits,
        total_visits
    )
    SELECT
        NEW.employee_id,
        NEW.plan_date,
        (SELECT COUNT(*) FROM doctor_visits dv
         JOIN daily_visit_plans dvp ON dv.plan_id = dvp.id
         WHERE dvp.plan_date = NEW.plan_date AND dvp.employee_id = NEW.employee_id),
        (SELECT COUNT(*) FROM doctor_visits WHERE employee_id = NEW.employee_id
         AND status = 'completed' AND is_additional_visit = FALSE
         AND DATE(meeting_time) = NEW.plan_date),
        (SELECT COUNT(*) FROM doctor_visits WHERE employee_id = NEW.employee_id
         AND status = 'completed' AND is_additional_visit = TRUE
         AND DATE(meeting_time) = NEW.plan_date),
        (SELECT COUNT(*) FROM doctor_visits WHERE employee_id = NEW.employee_id
         AND status = 'completed'
         AND DATE(meeting_time) = NEW.plan_date)
    ON CONFLICT (employee_id, metric_date)
    DO UPDATE SET
        planned_visits = EXCLUDED.planned_visits,
        completed_planned_visits = EXCLUDED.completed_planned_visits,
        additional_visits = EXCLUDED.additional_visits,
        total_visits = EXCLUDED.total_visits,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update performance metrics
DROP TRIGGER IF EXISTS trigger_update_performance_metrics ON daily_visit_plans;
CREATE TRIGGER trigger_update_performance_metrics
    AFTER INSERT OR UPDATE ON daily_visit_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_performance_metrics();

-- Grant necessary permissions
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;

COMMIT;
