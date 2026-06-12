import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, BookOpen, Briefcase, Edit2, Save, X, Award, GraduationCap, CheckCircle, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const UserProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form,    setForm]    = useState<any>({});
  const [error,   setError]   = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => { fetchProfile(); }, [user?.role]); // eslint-disable-line

  const fetchProfile = async () => {
    setLoading(true);
    try {
      if (user?.role === 'student') {
        const { data } = await api.get('/students/me');
        setProfile(data.student);
        setForm({ name: data.student.user?.name || '', phone: data.student.phone || '' });
      } else {
        const { data } = await api.get('/faculty/me');
        setProfile(data.faculty);
        setForm({ name: data.faculty.name || '', phone: data.faculty.phone || '', department: data.faculty.department || '', designation: data.faculty.designation || '' });
      }
    } catch { setError('Failed to load profile'); }
    finally { setLoading(false); }
  };

  const handleSave = async () => {
    setSaving(true); setError(''); setSuccess('');
    try {
      if (user?.role === 'student') await api.patch('/students/me/profile', form);
      else await api.patch('/faculty/me', form);
      setSuccess('Profile updated!');
      setEditing(false);
      fetchProfile();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Update failed');
    } finally { setSaving(false); }
  };

  if (loading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const isStudent = user?.role === 'student';
  const name  = isStudent ? profile?.user?.name  : profile?.name;
  const email = isStudent ? profile?.user?.email : profile?.email;
  const initials = name?.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2) || '?';

  const infoItems = [
    { icon: User,          label: 'Full Name',   value: name },
    { icon: Mail,          label: 'Email',       value: email },
    { icon: Phone,         label: 'Phone',       value: profile?.phone || 'Not set' },
    ...(isStudent ? [
      { icon: BookOpen,    label: 'Department',  value: profile?.department },
      { icon: GraduationCap, label: 'Semester',  value: `Semester ${profile?.semester}` },
      { icon: BookOpen,    label: 'Batch',       value: profile?.batch },
      { icon: Award,       label: 'CGPA',        value: profile?.cgpa?.toFixed(2) },
      { icon: Briefcase,   label: 'Roll Number', value: profile?.rollNumber },
    ] : [
      { icon: BookOpen,    label: 'Department',  value: profile?.department || 'Not set' },
      { icon: Briefcase,   label: 'Designation', value: profile?.designation || 'Not set' },
    ]),
  ];

  return (
    <div className="max-w-2xl space-y-5">
      <div>
        <h2 className="page-title">My Profile</h2>
        <p className="page-subtitle">View and update your profile information</p>
      </div>

      {/* Avatar Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="card">
        <div className="flex items-center gap-5">
          {/* Avatar */}
          <div className="relative flex-shrink-0">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold shadow-colored">
              {initials}
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white dark:border-gray-900" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">{name}</h3>
            <p className="text-gray-500 text-sm mt-0.5 truncate">{email}</p>
            <div className="flex items-center flex-wrap gap-2 mt-2.5">
              <span className="badge badge-blue capitalize">{user?.role}</span>
              {isStudent && profile?.department && (
                <span className="badge badge-purple">{profile.department}</span>
              )}
              {isStudent && profile?.cgpa && (
                <span className="badge badge-green">CGPA {profile.cgpa?.toFixed(1)}</span>
              )}
              {!isStudent && profile?.designation && (
                <span className="badge badge-purple">{profile.designation}</span>
              )}
            </div>
          </div>

          {!editing ? (
            <button onClick={() => setEditing(true)} className="btn-secondary text-sm flex-shrink-0">
              <Edit2 size={14} /> Edit
            </button>
          ) : (
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={handleSave} disabled={saving} className="btn-primary text-sm disabled:opacity-60">
                <Save size={14} /> {saving ? 'Saving...' : 'Save'}
              </button>
              <button onClick={() => { setEditing(false); setError(''); }}
                className="w-9 h-9 flex items-center justify-center border border-gray-200 dark:border-gray-700 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all">
                <X size={15} />
              </button>
            </div>
          )}
        </div>

        {/* Feedback */}
        {(error || success) && (
          <div className={`mt-4 flex items-center gap-2 text-sm px-4 py-3 rounded-xl ${
            error ? 'bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800'
                  : 'bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800'
          }`}>
            {error ? <AlertCircle size={15} /> : <CheckCircle size={15} />}
            {error || success}
          </div>
        )}
      </motion.div>

      {/* Info / Edit Card */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="card">
        <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-4">
          {editing ? 'Edit Information' : 'Profile Information'}
        </h4>

        {editing ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Full Name</label>
              <input className="input-field" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1.5">Phone</label>
              <input className="input-field" value={form.phone} placeholder="Enter phone number" onChange={e => setForm({ ...form, phone: e.target.value })} />
            </div>
            {!isStudent && (
              <>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Department</label>
                  <input className="input-field" value={form.department} onChange={e => setForm({ ...form, department: e.target.value })} />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Designation</label>
                  <input className="input-field" value={form.designation} onChange={e => setForm({ ...form, designation: e.target.value })} />
                </div>
              </>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {infoItems.map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800/60 rounded-xl">
                <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Icon size={14} className="text-primary-600 dark:text-primary-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-gray-400">{label}</p>
                  <p className="text-sm font-medium text-gray-800 dark:text-white truncate">{value}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Placement Status (student only) */}
      {isStudent && (
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="card">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Placement Status</h4>
          <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium capitalize ${
            profile?.placementStatus === 'placed'  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
            profile?.placementStatus === 'applied' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                                                     'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
          }`}>
            <Briefcase size={14} />
            {(profile?.placementStatus || 'not_applied').replace('_', ' ')}
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default UserProfile;
