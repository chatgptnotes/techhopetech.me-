'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface Doctor {
  id: string;
  doctor_name: string;
  whatsapp_number: string;
  specialty?: string;
  hospital_name?: string;
  city?: string;
  whatsapp_enabled: boolean;
}

interface Template {
  id: string;
  template_name: string;
  template_category: string;
  message_content: string;
  media_type: string;
  media_url?: string;
  placeholder_variables: string[];
  usage_count?: number;
}

interface VariableValue {
  variable: string;
  value: string;
}

export default function MessageComposer() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selectedDoctors, setSelectedDoctors] = useState<Set<string>>(new Set());
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [variableValues, setVariableValues] = useState<VariableValue[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    fetchDoctors();
    fetchTemplates();
  }, []);

  const fetchDoctors = async () => {
    try {
      const { data, error } = await supabase
        .from('referral_doctor_whatsapp_registry')
        .select('id, doctor_name, whatsapp_number, specialty, hospital_name, city, whatsapp_enabled')
        .eq('whatsapp_enabled', true)
        .order('doctor_name');

      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const { data, error } = await supabase
        .from('whatsapp_templates_library')
        .select('*')
        .eq('is_active', true)
        .order('template_name');

      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const handleSelectDoctor = (doctorId: string) => {
    const newSelection = new Set(selectedDoctors);
    if (newSelection.has(doctorId)) {
      newSelection.delete(doctorId);
    } else {
      newSelection.add(doctorId);
    }
    setSelectedDoctors(newSelection);
  };

  const handleSelectAll = () => {
    if (selectedDoctors.size === filteredDoctors.length) {
      setSelectedDoctors(new Set());
    } else {
      setSelectedDoctors(new Set(filteredDoctors.map(d => d.id)));
    }
  };

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template);
    setVariableValues(
      template.placeholder_variables.map(variable => ({
        variable,
        value: '',
      }))
    );
  };

  const handleVariableChange = (variable: string, value: string) => {
    setVariableValues(prev =>
      prev.map(item => (item.variable === variable ? { variable, value } : item))
    );
  };

  const getPreviewMessage = (doctor?: Doctor) => {
    if (!selectedTemplate) return '';

    let message = selectedTemplate.message_content;

    // Replace variables with values or defaults
    selectedTemplate.placeholder_variables.forEach(variable => {
      const varValue = variableValues.find(v => v.variable === variable)?.value;
      let replacement = varValue || `{${variable}}`;

      // Auto-replace common variables for specific doctors
      if (doctor) {
        if (variable === 'doctor_name') replacement = doctor.doctor_name;
        if (variable === 'hospital_name' && doctor.hospital_name) replacement = doctor.hospital_name;
        if (variable === 'specialty' && doctor.specialty) replacement = doctor.specialty;
        if (variable === 'city' && doctor.city) replacement = doctor.city;
      }

      message = message.replace(new RegExp(`{${variable}}`, 'g'), replacement);
    });

    return message;
  };

  /**
   * Open WhatsApp click-to-chat (wa.me) with the personalized message
   * pre-filled. Works without any API — uses the user's own WhatsApp
   * (app on mobile, WhatsApp Web on desktop). Fallback when the
   * Doubletick API send fails or is unavailable.
   */
  const openInWhatsApp = (doctor: Doctor) => {
    const digits = doctor.whatsapp_number.replace(/[^0-9]/g, '');
    if (!digits) {
      alert(`No WhatsApp number saved for ${doctor.doctor_name}`);
      return;
    }
    const message = selectedTemplate ? getPreviewMessage(doctor) : '';
    const url = message
      ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}`
      : `https://wa.me/${digits}`;
    window.open(url, '_blank', 'noopener');
  };

  const handleSendMessage = async () => {
    if (selectedDoctors.size === 0 || !selectedTemplate) {
      alert('Please select doctors and a template');
      return;
    }

    // Check if all required variables have values
    const emptyVariables = variableValues.filter(v => !v.value);
    if (emptyVariables.length > 0) {
      alert(`Please provide values for all variables: ${emptyVariables.map(v => v.variable).join(', ')}`);
      return;
    }

    setSending(true);

    try {
      const selectedDoctorsList = doctors.filter(d => selectedDoctors.has(d.id));
      const results: Array<{ doctor: string; ok: boolean; error?: string }> = [];

      // Get the session access token for the server route (real WhatsApp send).
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData?.session?.access_token;

      for (const doctor of selectedDoctorsList) {
        const personalizedMessage = getPreviewMessage(doctor);

        // 1. Log the outgoing message as pending
        const { data: inserted, error } = await supabase
          .from('whatsapp_communication_history')
          .insert({
            doctor_id: doctor.id,
            template_id: selectedTemplate.id,
            template_name: selectedTemplate.template_name,
            message_content: personalizedMessage,
            message_type: selectedTemplate.template_category,
            recipient_count: 1,
            delivery_status: 'pending',
          })
          .select('id')
          .single();

        if (error) throw error;

        // 2. Actually send via Doubletick (server-side, keeps the API key secret)
        let sendOk = false;
        let sendError: string | undefined;
        let doubletickId: string | undefined;

        if (accessToken) {
          try {
            const res = await fetch('/api/whatsapp/send', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`,
              },
              body: JSON.stringify({ to: doctor.whatsapp_number, message: personalizedMessage }),
            });
            const json = await res.json();
            if (json.success) {
              sendOk = true;
              doubletickId = json.messageId;
            } else {
              sendError = json.error || `Send failed (HTTP ${res.status})`;
            }
          } catch (e) {
            sendError = e instanceof Error ? e.message : 'Network error calling send API';
          }
        } else {
          sendError = 'No active session — cannot send';
        }

        // 3. Record the real outcome on the history row
        await supabase
          .from('whatsapp_communication_history')
          .update({
            delivery_status: sendOk ? 'sent' : 'failed',
            doubletick_message_id: doubletickId || null,
            error_message: sendError || null,
          })
          .eq('id', inserted.id);

        results.push({ doctor: doctor.doctor_name, ok: sendOk, error: sendError });
      }

      // Update template usage count
      await supabase
        .from('whatsapp_templates_library')
        .update({ usage_count: (selectedTemplate.usage_count || 0) + selectedDoctors.size })
        .eq('id', selectedTemplate.id);

      const sent = results.filter(r => r.ok).length;
      const failed = results.length - sent;
      const summary =
        failed === 0
          ? `Messages sent to ${sent} doctor(s) successfully!`
          : `Automatic send failed for ${failed} of ${results.length} doctor(s) (Doubletick issue).\n\n` +
            `➡ You can still send now: click the green WhatsApp button next to each doctor ` +
            `in the Recipients list — WhatsApp opens with the message pre-filled.\n\n` +
            results
              .filter(r => !r.ok)
              .map(r => `• ${r.doctor}: ${r.error}`)
              .join('\n');

      alert(summary);
      setSelectedDoctors(new Set());
      setSelectedTemplate(null);
      setVariableValues([]);
      setPreviewMode(false);
    } catch (error) {
      console.error('Error sending messages:', error);
      alert('Failed to send messages. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const filteredDoctors = doctors.filter(
    doctor =>
      doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.specialty?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Send WhatsApp Message</h2>
          <p className="text-gray-600 mt-1">Select doctors and templates to send messages</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column - Doctor Selection */}
        <div className="space-y-6">
          {/* Template Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Select Template</h3>
            <div className="space-y-3">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading templates...</p>
                </div>
              ) : templates.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No templates available. Create templates first.</p>
              ) : (
                templates.map((template) => (
                  <button
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                      selectedTemplate?.id === template.id
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-gray-800">{template.template_name}</div>
                    <div className="text-sm text-gray-600 mt-1">{template.template_category}</div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Doctor Selection */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Select Recipients</h3>
              <button
                onClick={handleSelectAll}
                className="text-sm text-green-600 hover:text-green-800"
              >
                {selectedDoctors.size === filteredDoctors.length ? 'Deselect All' : 'Select All'}
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search doctors..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="space-y-2 max-h-96 overflow-y-auto">
              {loading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading doctors...</p>
                </div>
              ) : filteredDoctors.length === 0 ? (
                <p className="text-gray-500 text-center py-4">No doctors found</p>
              ) : (
                filteredDoctors.map((doctor) => (
                  <label
                    key={doctor.id}
                    className={`flex items-center p-3 rounded-lg cursor-pointer transition-colors ${
                      selectedDoctors.has(doctor.id) ? 'bg-green-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedDoctors.has(doctor.id)}
                      onChange={() => handleSelectDoctor(doctor.id)}
                      className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                    />
                    <div className="ml-3 flex-1">
                      <div className="text-sm font-medium text-gray-800">{doctor.doctor_name}</div>
                      <div className="text-xs text-gray-500">{doctor.specialty || 'General'}</div>
                    </div>
                    <div className="text-xs text-gray-600 mr-3">{doctor.whatsapp_number}</div>
                    <button
                      type="button"
                      title={`Open WhatsApp chat with ${doctor.doctor_name} (message pre-filled)`}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        openInWhatsApp(doctor);
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-full bg-green-600 text-white hover:bg-green-700 transition-colors flex-shrink-0"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                      </svg>
                    </button>
                  </label>
                ))
              )}
            </div>

            {selectedDoctors.size > 0 && (
              <div className="mt-4 p-3 bg-green-50 rounded-lg">
                <p className="text-sm text-green-800">
                  <strong>{selectedDoctors.size}</strong> doctor{selectedDoctors.size > 1 ? 's' : ''} selected
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Message Preview */}
        <div className="space-y-6">
          {selectedTemplate && (
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Message Preview</h3>

              {/* Variable Input */}
              {selectedTemplate.placeholder_variables.length > 0 && (
                <div className="mb-6 space-y-3">
                  <h4 className="text-sm font-medium text-gray-700">Personalization</h4>
                  {selectedTemplate.placeholder_variables.map((variable) => (
                    <div key={variable}>
                      <label className="block text-xs text-gray-600 mb-1">
                        {variable.charAt(0).toUpperCase() + variable.slice(1).replace(/_/g, ' ')}
                      </label>
                      <input
                        type="text"
                        value={variableValues.find(v => v.variable === variable)?.value || ''}
                        onChange={(e) => handleVariableChange(variable, e.target.value)}
                        placeholder={`Enter ${variable}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm"
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* Preview */}
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-3">Preview Message</h4>
                <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                  <div className="text-sm text-gray-800 whitespace-pre-wrap">{getPreviewMessage()}</div>
                </div>
              </div>

              {/* Selected Recipients Preview */}
              {selectedDoctors.size > 0 && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-3">Recipients ({selectedDoctors.size})</h4>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {Array.from(selectedDoctors)
                      .slice(0, 5)
                      .map((id) => {
                        const doctor = doctors.find(d => d.id === id);
                        return doctor ? (
                          <div key={doctor.id} className="text-sm text-gray-600">
                            {doctor.doctor_name} ({doctor.whatsapp_number})
                          </div>
                        ) : null;
                      })}
                    {selectedDoctors.size > 5 && (
                      <div className="text-sm text-gray-500">
                        ... and {selectedDoctors.size - 5} more
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Send Button */}
              <button
                onClick={handleSendMessage}
                disabled={sending || selectedDoctors.size === 0}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sending ? 'Sending...' : `Send to ${selectedDoctors.size} Recipient${selectedDoctors.size > 1 ? 's' : ''}`}
              </button>
            </div>
          )}

          {!selectedTemplate && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="text-center py-8">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-gray-500">Select a template to preview</p>
                <p className="text-gray-400 text-sm mt-1">Choose from the available templates on the left</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}