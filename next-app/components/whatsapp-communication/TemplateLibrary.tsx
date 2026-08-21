'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface Template {
  id: string;
  template_name: string;
  template_category: string;
  message_content: string;
  media_type: string;
  media_url?: string;
  placeholder_variables: string[];
  is_active: boolean;
  usage_count: number;
  created_at: string;
}

export default function TemplateLibrary() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null);
  const [filterCategory, setFilterCategory] = useState('');
  const [formData, setFormData] = useState<{
    template_name: string;
    template_category: string;
    message_content: string;
    media_type: string;
    media_url: string;
    placeholder_variables: string[];
    is_active: boolean;
  }>({
    template_name: '',
    template_category: 'daily_greeting',
    message_content: '',
    media_type: 'text',
    media_url: '',
    placeholder_variables: [],
    is_active: true,
  });

  const supabase = createClient();

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('whatsapp_templates_library')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setTemplates(data || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Extract placeholder variables from message content
      const variablePattern = /\{([^}]+)\}/g;
      const matches = formData.message_content.match(variablePattern);
      const variables = matches ? matches.map(match => match.replace(/[{}]/g, '')) : [];

      const templateData = {
        ...formData,
        placeholder_variables: variables,
      };

      if (editingTemplate) {
        const { error } = await supabase
          .from('whatsapp_templates_library')
          .update(templateData)
          .eq('id', editingTemplate.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('whatsapp_templates_library')
          .insert(templateData);

        if (error) throw error;
      }

      // Reset form and refresh list
      setFormData({
        template_name: '',
        template_category: 'daily_greeting',
        message_content: '',
        media_type: 'text',
        media_url: '',
        placeholder_variables: [],
        is_active: true,
      });
      setShowAddForm(false);
      setEditingTemplate(null);
      fetchTemplates();
    } catch (error) {
      console.error('Error saving template:', error);
      alert('Failed to save template. Please try again.');
    }
  };

  const handleEdit = (template: Template) => {
    setEditingTemplate(template);
    setFormData({
      template_name: template.template_name,
      template_category: template.template_category as any,
      message_content: template.message_content,
      media_type: template.media_type,
      media_url: template.media_url || '',
      placeholder_variables: template.placeholder_variables,
      is_active: template.is_active,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;

    try {
      const { error } = await supabase
        .from('whatsapp_templates_library')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error deleting template:', error);
      alert('Failed to delete template. Please try again.');
    }
  };

  const handleToggleActive = async (template: Template) => {
    try {
      const { error } = await supabase
        .from('whatsapp_templates_library')
        .update({ is_active: !template.is_active })
        .eq('id', template.id);

      if (error) throw error;
      fetchTemplates();
    } catch (error) {
      console.error('Error toggling template status:', error);
      alert('Failed to update template status. Please try again.');
    }
  };

  const filteredTemplates = templates.filter(template =>
    !filterCategory || template.template_category === filterCategory
  );

  const categories = [
    { value: 'daily_greeting', label: 'Daily Greeting' },
    { value: 'festival', label: 'Festival Greeting' },
    { value: 'promotion', label: 'Promotion' },
    { value: 'hospital_update', label: 'Hospital Update' },
    { value: 'health_camp', label: 'Health Camp' },
    { value: 'service_launch', label: 'Service Launch' },
    { value: 'doctor_appreciation', label: 'Doctor Appreciation' },
    { value: 'custom', label: 'Custom' },
  ];

  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      daily_greeting: 'bg-green-100 text-green-800',
      festival: 'bg-purple-100 text-purple-800',
      promotion: 'bg-blue-100 text-blue-800',
      hospital_update: 'bg-yellow-100 text-yellow-800',
      health_camp: 'bg-red-100 text-red-800',
      service_launch: 'bg-indigo-100 text-indigo-800',
      doctor_appreciation: 'bg-pink-100 text-pink-800',
      custom: 'bg-gray-100 text-gray-800',
    };
    return colors[category] || colors.custom;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Template Library</h2>
          <p className="text-gray-600 mt-1">Manage WhatsApp message templates</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingTemplate(null);
            setFormData({
              template_name: '',
              template_category: 'daily_greeting',
              message_content: '',
              media_type: 'text',
              media_url: '',
              placeholder_variables: [],
              is_active: true,
            });
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
        >
          Add Template
        </button>
      </div>

      {/* Filter */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center space-x-4">
          <label className="text-sm font-medium text-gray-700">Filter by Category:</label>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat.value} value={cat.value}>{cat.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingTemplate ? 'Edit Template' : 'Add New Template'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Template Name *</label>
                <input
                  type="text"
                  value={formData.template_name}
                  onChange={(e) => setFormData({ ...formData, template_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category *</label>
                <select
                  value={formData.template_category}
                  onChange={(e) => setFormData({ ...formData, template_category: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  {categories.map(cat => (
                    <option key={cat.value} value={cat.value}>{cat.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Media Type</label>
                <select
                  value={formData.media_type}
                  onChange={(e) => setFormData({ ...formData, media_type: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                >
                  <option value="text">Text Only</option>
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                  <option value="document">Document</option>
                  <option value="audio">Audio</option>
                </select>
              </div>

              {formData.media_type !== 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Media URL</label>
                  <input
                    type="url"
                    value={formData.media_url}
                    onChange={(e) => setFormData({ ...formData, media_url: e.target.value })}
                    placeholder="https://example.com/media.jpg"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Message Content *</label>
              <textarea
                value={formData.message_content}
                onChange={(e) => setFormData({ ...formData, message_content: e.target.value })}
                required
                rows={6}
                placeholder="Enter your message here. Use {variable_name} for dynamic content."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                Tip: Use {'{variable_name}'} for placeholder variables like {'{doctor_name}'}, {'{hospital}'}, etc.
              </p>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
              />
              <label htmlFor="is_active" className="ml-2 text-sm text-gray-700">
                Template Active
              </label>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingTemplate(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {editingTemplate ? 'Update Template' : 'Add Template'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading templates...</p>
          </div>
        ) : filteredTemplates.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-gray-500">No templates found</p>
            <p className="text-gray-400 text-sm mt-1">Create your first WhatsApp message template</p>
          </div>
        ) : (
          filteredTemplates.map((template) => (
            <div key={template.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow">
              <div className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-800">{template.template_name}</h3>
                    <span className={`inline-block mt-2 px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(template.template_category)}`}>
                      {categories.find(c => c.value === template.template_category)?.label || template.template_category}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleActive(template)}
                      className={`text-sm ${template.is_active ? 'text-green-600' : 'text-gray-400'}`}
                    >
                      {template.is_active ? '✓ Active' : '○ Inactive'}
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm text-gray-600 line-clamp-3">{template.message_content}</p>
                  </div>

                  {template.placeholder_variables.length > 0 && (
                    <div>
                      <p className="text-xs font-medium text-gray-700 mb-1">Variables:</p>
                      <div className="flex flex-wrap gap-1">
                        {template.placeholder_variables.map((variable, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                            {`{${variable}}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-500">
                      Used {template.usage_count} times
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleEdit(template)}
                        className="text-sm text-green-600 hover:text-green-900"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(template.id)}
                        className="text-sm text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}