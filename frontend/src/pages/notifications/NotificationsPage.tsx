import React, { useState, useEffect, useCallback } from 'react';
import { Bell, CheckCheck, Trash2, Megaphone, RefreshCw, X, AlertTriangle, Info, Award, Briefcase, BookOpen } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';

const typeIcon: Record<string, any>    = { attendance: AlertTriangle, academic: BookOpen, placement: Briefcase, achievement: Award, general: Info };
const typeBg:   Record<string, string> = {
  attendance:  'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  academic:    'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  placement:   'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
  achievement: 'bg-yellow-100 text-yellow-600 dark:bg-yellow-900/30 dark:text-yellow-400',
  general:     'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400',
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount,   setUnreadCount]   = useState(0);
  const [loading,       setLoading]       = useState(true);
  const [showBroadcast, setShowBroadcast] = useState(false);
  const [broadcastForm, setBroadcastForm] = useState({ title: '', message: '', type: 'general' });
  const [sending,       setSending]       = useState(false);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/notifications');
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchNotifications(); }, [fetchNotifications]);

  const markRead    = async (id: string) => {
    await api.put(`/notifications/${id}/read`);
    setNotifications(prev => prev.map(n => n._id === id ? { ...n, isRead: true } : n));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };
  const markAllRead = async () => { await api.put('/notifications/read-all'); setNotifications(prev => prev.map(n => ({ ...n, isRead: true }))); setUnreadCount(0); };
  const deleteNotif = async (id: string) => { await api.delete(`/notifications/${id}`); setNotifications(prev => prev.filter(n => n._id !== id)); };
  const clearAll    = async () => { if (!window.confirm('Clear all notifications?')) return; await api.delete('/notifications/clear-all'); setNotifications([]); setUnreadCount(0); };
  const sendAlerts  = async () => {
    try { const { data } = await api.post('/notifications/send-defaulter-alerts', {}); alert(data.message); fetchNotifications(); }
    catch (err: any) { alert(err.response?.data?.message || 'Failed'); }
  };
  const handleBroadcast = async (e: React.FormEvent) => {
    e.preventDefault(); setSending(true);
    try { await api.post('/notifications/broadcast', broadcastForm); setShowBroadcast(false); setBroadcastForm({ title: '', message: '', type: 'general' }); }
    catch (err: any) { alert(err.response?.data?.message || 'Broadcast failed'); }
    finally { setSending(false); }
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const m = Math.floor(diff / 60000), h = Math.floor(diff / 3600000), d = Math.floor(diff / 86400000);
    if (m < 1) return 'Just now'; if (m < 60) return `${m}m ago`; if (h < 24) return `${h}h ago`; return `${d}d ago`;
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="page-header">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Bell size={22} className="text-gray-700 dark:text-gray-300" />
            {unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500 text-white text-[10px] rounded-full flex items-center justify-center font-bold px-0.5">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </div>
          <div>
            <h2 className="page-title">Notifications</h2>
            <p className="page-subtitle">{unreadCount} unread</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={fetchNotifications} className="w-9 h-9 flex items-center justify-center text-gray-400 hover:text-primary-500 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
            <RefreshCw size={15} />
          </button>
          {unreadCount > 0 && (
            <button onClick={markAllRead}
              className="flex items-center gap-1.5 text-sm text-primary-600 hover:text-primary-700 px-3 py-2 rounded-xl hover:bg-primary-50 dark:hover:bg-primary-900/20 transition font-medium">
              <CheckCheck size={14} /> Mark all read
            </button>
          )}
          {notifications.length > 0 && (
            <button onClick={clearAll}
              className="flex items-center gap-1.5 text-sm text-red-500 hover:text-red-700 px-3 py-2 rounded-xl hover:bg-red-50 dark:hover:bg-red-900/20 transition font-medium">
              <Trash2 size={14} /> Clear all
            </button>
          )}
        </div>
      </div>

      {/* Admin/Faculty Actions */}
      {(user?.role === 'admin' || user?.role === 'faculty') && (
        <div className="flex flex-wrap gap-2">
          {user?.role === 'admin' && (
            <button onClick={() => setShowBroadcast(true)} className="btn-primary text-sm">
              <Megaphone size={15} /> Broadcast to Students
            </button>
          )}
          <button onClick={sendAlerts} className="btn-danger text-sm">
            <AlertTriangle size={15} /> Send Defaulter Alerts
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-2">
          {[1,2,3,4].map(i => (
            <div key={i} className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-4 flex items-center gap-4">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3.5 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-1/3" />
                <div className="h-3 bg-gray-100 dark:bg-gray-800 rounded animate-pulse w-2/3" />
              </div>
            </div>
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 p-16 text-center">
          <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Bell size={28} className="text-gray-300 dark:text-gray-600" />
          </div>
          <p className="text-gray-500 font-medium">All caught up!</p>
          <p className="text-gray-400 text-sm mt-1">No notifications yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {notifications.map((n, i) => {
              const Icon = typeIcon[n.type] || Info;
              const colorClass = typeBg[n.type] || typeBg.general;
              return (
                <motion.div key={n._id}
                  initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: 30 }} transition={{ delay: i * 0.03 }}
                  onClick={() => !n.isRead && markRead(n._id)}
                  className={`bg-white dark:bg-gray-900 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 p-4
                    ${!n.isRead
                      ? 'border-primary-200 dark:border-primary-800 shadow-sm'
                      : 'border-gray-100 dark:border-gray-800 hover:border-gray-200 dark:hover:border-gray-700'
                    }`}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${colorClass}`}>
                    <Icon size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`text-sm font-semibold leading-snug ${!n.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        {n.title}
                        {!n.isRead && <span className="ml-2 w-1.5 h-1.5 bg-primary-500 rounded-full inline-block align-middle" />}
                      </p>
                      <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{timeAgo(n.createdAt)}</span>
                    </div>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 leading-snug">{n.message}</p>
                    <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded-full capitalize font-medium ${colorClass}`}>{n.type}</span>
                  </div>
                  <button onClick={e => { e.stopPropagation(); deleteNotif(n._id); }}
                    className="w-7 h-7 flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition flex-shrink-0">
                    <X size={13} />
                  </button>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Broadcast Modal */}
      <AnimatePresence>
        {showBroadcast && (
          <div className="modal-overlay">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="modal-box max-w-md p-6">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white">Broadcast Notification</h3>
                  <p className="text-sm text-gray-500 mt-0.5">Send to all students</p>
                </div>
                <button onClick={() => setShowBroadcast(false)} className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition">
                  <X size={16} />
                </button>
              </div>
              <form onSubmit={handleBroadcast} className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Title</label>
                  <input className="input-field" placeholder="Notification title *" value={broadcastForm.title}
                    onChange={e => setBroadcastForm({ ...broadcastForm, title: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Message</label>
                  <textarea className="input-field resize-none" rows={3} placeholder="Your message *" value={broadcastForm.message}
                    onChange={e => setBroadcastForm({ ...broadcastForm, message: e.target.value })} required />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 mb-1.5">Type</label>
                  <select className="input-field" value={broadcastForm.type} onChange={e => setBroadcastForm({ ...broadcastForm, type: e.target.value })}>
                    {['general','academic','placement','attendance','achievement'].map(t => (
                      <option key={t} value={t} className="capitalize">{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div className="flex gap-3 pt-1">
                  <button type="button" onClick={() => setShowBroadcast(false)} className="btn-secondary flex-1 py-2.5 text-sm justify-center">Cancel</button>
                  <button type="submit" disabled={sending} className="btn-primary flex-1 py-2.5 text-sm justify-center disabled:opacity-60">
                    {sending ? 'Sending...' : 'Send to All'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default NotificationsPage;
