'use client';

import { useState, useEffect } from 'react';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';

interface Doctor {
  id: string;
  doctor_name: string;
  whatsapp_number: string;
  email?: string;
  phone?: string;
  specialty?: string;
  qualification?: string;
  department?: string;
  hospital_name?: string;
  city?: string;
  remarks?: string;
  whatsapp_enabled: boolean;
  communication_preferences: Record<string, boolean>;
  last_communication_date?: string;
  total_messages_sent: number;
  total_messages_delivered: number;
  communication_score: number;
  created_at: string;
}

export default function DoctorManagement() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [formData, setFormData] = useState({
    doctor_name: '',
    whatsapp_number: '',
    phone: '',
    specialty: '',
    qualification: '',
    department: '',
    hospital_name: '',
    city: '',
    remarks: '',
    whatsapp_enabled: true,
  });

  const supabase = getSupabaseBrowserClient();

  useEffect(() => {
    fetchDoctors();
  }, []);

  const fetchDoctors = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('referral_doctor_whatsapp_registry')
        .select('*')
        .order('created_at', { ascending: false });

      const { data, error } = await query;
      if (error) throw error;
      setDoctors(data || []);
    } catch (error) {
      console.error('Error fetching doctors:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Prepare data with required database fields
      const doctorData = {
        doctor_name: formData.doctor_name,
        whatsapp_number: formData.whatsapp_number,
        phone: formData.phone || null,
        specialty: formData.specialty || null,
        qualification: formData.qualification || null,
        department: formData.department || null,
        hospital_name: formData.hospital_name || null,
        city: formData.city || null,
        remarks: formData.remarks || null,
        whatsapp_enabled: formData.whatsapp_enabled,
        // Required database fields with defaults
        total_messages_sent: 0,
        total_messages_delivered: 0,
        communication_score: 0,
        last_communication_date: null,
        // Communication preferences - only include for new records
        ...(editingDoctor ? {} : {
          communication_preferences: {
            daily_greetings: true,
            festivals: true,
            promotions: true,
            custom: true,
          }
        })
      };

      console.log('Submitting doctor data:', doctorData);

      if (editingDoctor) {
        const { data, error } = await supabase
          .from('referral_doctor_whatsapp_registry')
          .update(doctorData)
          .eq('id', editingDoctor.id)
          .select();

        if (error) {
          console.error('Update error:', error);
          throw error;
        }
        console.log('Doctor updated successfully:', data);
      } else {
        const { data, error } = await supabase
          .from('referral_doctor_whatsapp_registry')
          .insert(doctorData)
          .select();

        if (error) {
          console.error('Insert error:', JSON.stringify(error, null, 2));
          console.error('Error details:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
          });
          throw error;
        }
        console.log('Doctor created successfully:', data);
      }

      // Reset form and refresh list
      setFormData({
        doctor_name: '',
        whatsapp_number: '',
        phone: '',
        specialty: '',
        qualification: '',
        department: '',
        hospital_name: '',
        city: '',
        remarks: '',
        whatsapp_enabled: true,
      });
      setShowAddForm(false);
      setEditingDoctor(null);
      fetchDoctors();
    } catch (err) {
      console.error('Error saving doctor:', JSON.stringify(err, null, 2));

      const message =
        err && typeof err === 'object' && 'message' in err
          ? String((err as { message?: unknown }).message)
          : '';

      alert(
        message
          ? `Failed to save doctor: ${message}`
          : 'Failed to save doctor. Please check your connection and try again.'
      );
    }
  };

  const handleEdit = (doctor: Doctor) => {
    setEditingDoctor(doctor);
    setFormData({
      doctor_name: doctor.doctor_name,
      whatsapp_number: doctor.whatsapp_number,
      phone: doctor.phone || '',
      specialty: doctor.specialty || '',
      qualification: doctor.qualification || '',
      department: doctor.department || '',
      hospital_name: doctor.hospital_name || '',
      city: doctor.city || '',
      remarks: doctor.remarks || '',
      whatsapp_enabled: doctor.whatsapp_enabled,
    });
    setShowAddForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this doctor?')) return;

    try {
      const { error } = await supabase
        .from('referral_doctor_whatsapp_registry')
        .delete()
        .eq('id', id);

      if (error) throw error;
      fetchDoctors();
    } catch (error) {
      console.error('Error deleting doctor:', error);
      alert('Failed to delete doctor. Please try again.');
    }
  };

  const filteredDoctors = doctors.filter(doctor => {
    const matchesSearch =
      doctor.doctor_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doctor.whatsapp_number.includes(searchTerm) ||
      doctor.hospital_name?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesSpecialty = !filterSpecialty || doctor.specialty === filterSpecialty;
    const matchesCity = !filterCity || doctor.city === filterCity;

    return matchesSearch && matchesSpecialty && matchesCity;
  });

  const specialties = [...new Set(doctors.map(d => d.specialty).filter(Boolean))];
  const cities = [...new Set(doctors.map(d => d.city).filter(Boolean))];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Doctor Management</h2>
          <p className="text-gray-600 mt-1">Manage referral doctors for WhatsApp communication</p>
        </div>
        <button
          onClick={() => {
            setShowAddForm(true);
            setEditingDoctor(null);
            setFormData({
              doctor_name: '',
              whatsapp_number: '',
              phone: '',
              specialty: '',
              qualification: '',
              department: '',
              hospital_name: '',
              city: '',
              remarks: '',
              whatsapp_enabled: true,
            });
          }}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors font-medium"
        >
          Add Doctor
        </button>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Search Doctors</label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Name, number, or hospital..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Specialty</label>
            <select
              value={filterSpecialty}
              onChange={(e) => setFilterSpecialty(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Specialties</option>
              {specialties.map(specialty => (
                <option key={specialty} value={specialty}>{specialty}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Filter by City</label>
            <select
              value={filterCity}
              onChange={(e) => setFilterCity(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            >
              <option value="">All Cities</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Add/Edit Form */}
      {showAddForm && (
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingDoctor ? 'Edit Doctor' : 'Add New Doctor'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Doctor Name *</label>
                <input
                  type="text"
                  value={formData.doctor_name}
                  onChange={(e) => setFormData({ ...formData, doctor_name: e.target.value })}
                  required
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">WhatsApp Number *</label>
                <input
                  type="text"
                  value={formData.whatsapp_number}
                  onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                  required
                  placeholder="+91XXXXXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                <input
                  type="text"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+91XXXXXXXXXX"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Specialty</label>
                <input
                  type="text"
                  value={formData.specialty}
                  onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                  placeholder="Cardiology, Orthopedics, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Qualification</label>
                <input
                  type="text"
                  value={formData.qualification}
                  onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                  placeholder="MBBS, MD, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  placeholder="Cardiology, Orthopedics, etc."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Hospital/Clinic Name</label>
                <input
                  type="text"
                  value={formData.hospital_name}
                  onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="whatsapp_enabled"
                  checked={formData.whatsapp_enabled}
                  onChange={(e) => setFormData({ ...formData, whatsapp_enabled: e.target.checked })}
                  className="w-4 h-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                />
                <label htmlFor="whatsapp_enabled" className="ml-2 text-sm text-gray-700">
                  Enable WhatsApp Communication
                </label>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Remarks (Optional)</label>
              <textarea
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
              />
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => {
                  setShowAddForm(false);
                  setEditingDoctor(null);
                }}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors"
              >
                {editingDoctor ? 'Update Doctor' : 'Add Doctor'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Doctors List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading doctors...</p>
          </div>
        ) : filteredDoctors.length === 0 ? (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <p className="text-gray-500">No doctors found</p>
            <p className="text-gray-400 text-sm mt-1">Add your first referral doctor to get started</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Doctor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hospital</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">WhatsApp</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stats</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDoctors.map((doctor) => (
                  <tr key={doctor.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                          <span className="text-green-600 font-medium">{doctor.doctor_name.charAt(0)}</span>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{doctor.doctor_name}</div>
                          <div className="text-sm text-gray-500">{doctor.whatsapp_number}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.specialty || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.hospital_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{doctor.city || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {doctor.whatsapp_enabled ? (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                          Active
                        </span>
                      ) : (
                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          Disabled
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        <div>Sent: {doctor.total_messages_sent}</div>
                        <div className="text-gray-500">Delivered: {doctor.total_messages_delivered}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">Score: {doctor.communication_score}</div>
                        <div className="text-gray-500">
                          {doctor.last_communication_date
                            ? new Date(doctor.last_communication_date).toLocaleDateString()
                            : 'Never'}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleEdit(doctor)}
                        className="text-green-600 hover:text-green-900 mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(doctor.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}