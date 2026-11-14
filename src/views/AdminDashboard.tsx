import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, LayoutDashboard, BookOpen, Users, CreditCard, 
  Settings, Key, AlertTriangle, CheckCircle2, Plus, Edit2, 
  Trash2, ArrowUp, ArrowDown, Eye, EyeOff, Save, RefreshCw, 
  Smartphone, LogOut, Check, X, ShieldAlert, FileText, ExternalLink
} from 'lucide-react';
import { api, storage } from '../services/api.ts';
import type { Course, Lesson, Student, PaymentRecord, AuditLog, SupportTicket } from '../types/index.ts';

interface AdminDashboardProps {
  onExit: () => void;
  onRefreshData: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onExit, onRefreshData }) => {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return Boolean(storage.getAdminToken());
  });
  const [secretKeyInput, setSecretKeyInput] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Active Tab in Admin
  const [activeTab, setActiveTab] = useState<'overview' | 'lessons' | 'students' | 'payments' | 'course' | 'apk' | 'audit'>('overview');

  // Admin Data State
  const [overview, setOverview] = useState<any>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [students, setStudents] = useState<(Student & { purchaseRecord?: PaymentRecord })[]>([]);
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [course, setCourse] = useState<Course | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Modals / Form States
  const [editingLesson, setEditingLesson] = useState<Partial<Lesson> | null>(null);
  const [isNewLesson, setIsNewLesson] = useState(false);
  const [grantReason, setGrantReason] = useState('');
  const [selectedStudentForAction, setSelectedStudentForAction] = useState<Student | null>(null);
  const [actionType, setActionType] = useState<'grant' | 'revoke' | null>(null);
  const [courseForm, setCourseForm] = useState<Partial<Course>>({});
  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);
  const [backupStatusMsg, setBackupStatusMsg] = useState<string | null>(null);
  const [apkUrlInput, setApkUrlInput] = useState('');
  const [hasUploadedApk, setHasUploadedApk] = useState(false);
  const [uploadedApkSize, setUploadedApkSize] = useState(0);
  const [apkStatusMsg, setApkStatusMsg] = useState<string | null>(null);
  const [apkSaving, setApkSaving] = useState(false);
  const [adminToast, setAdminToast] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [confirmDeleteLesson, setConfirmDeleteLesson] = useState<{ id: string; title: string } | null>(null);

  // Check login
  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await api.adminLogin(secretKeyInput.trim());
      setIsAuthenticated(true);
      fetchAdminData();
    } catch (err: any) {
      setLoginError(err.message || 'Incorrect Master Admin Key.');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = () => {
    storage.removeAdminToken();
    setIsAuthenticated(false);
    onExit();
  };

  const fetchAdminData = async () => {
    setLoadingData(true);
    try {
      const [ov, std, pay, crs, lsn, aud, sup, apkCfg] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminStudents(),
        api.getAdminPayments(),
        api.getCourse(),
        api.getLessons(),
        api.getAuditLogs(),
        api.getSupportTickets(),
        api.getAdminApkConfig()
      ]);
      setOverview(ov);
      setStudents(std.students);
      setPayments(pay.payments);
      setCourse(crs.course);
      setCourseForm(crs.course);
      setLessons(lsn.lessons);
      setAuditLogs(aud.logs);
      setSupportTickets(sup.tickets);
      setApkUrlInput(apkCfg.apkDownloadUrl || '');
      setHasUploadedApk(apkCfg.hasUploadedApk);
      setUploadedApkSize(apkCfg.uploadedApkSize || 0);
    } catch (err) {
      console.error('Failed to load admin data', err);
      // If token expired
      storage.removeAdminToken();
      setIsAuthenticated(false);
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      fetchAdminData();
    }
  }, [isAuthenticated]);

  // Lesson Handlers
  const handleSaveLesson = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingLesson) return;

    try {
      if (isNewLesson) {
        await api.addLesson(editingLesson);
      } else if (editingLesson.id) {
        await api.updateLesson(editingLesson.id, editingLesson);
      }
      setEditingLesson(null);
      setIsNewLesson(false);
      setAdminToast({ type: 'success', text: 'Episode saved successfully.' });
      fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Failed to save episode' });
    }
  };

  const handleConfirmDeleteLesson = async () => {
    if (!confirmDeleteLesson) return;
    try {
      await api.deleteLesson(confirmDeleteLesson.id);
      setConfirmDeleteLesson(null);
      setAdminToast({ type: 'success', text: 'Episode deleted.' });
      fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Failed to delete episode' });
      setConfirmDeleteLesson(null);
    }
  };

  const handleMoveLesson = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= lessons.length) return;

    const reordered = [...lessons];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    try {
      await api.reorderLessons(reordered.map(l => l.id));
      fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Failed to reorder episodes' });
    }
  };

  const handleTogglePublish = async (lesson: Lesson) => {
    try {
      await api.updateLesson(lesson.id, { isPublished: !lesson.isPublished });
      fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Failed to update visibility' });
    }
  };

  // Student Access Handlers
  const handleStudentAccessConfirm = async () => {
    if (!selectedStudentForAction || !actionType) return;
    try {
      if (actionType === 'grant') {
        await api.grantStudentAccess(selectedStudentForAction.id, grantReason);
      } else {
        await api.revokeStudentAccess(selectedStudentForAction.id, grantReason);
      }
      setSelectedStudentForAction(null);
      setActionType(null);
      setGrantReason('');
      setAdminToast({ type: 'success', text: 'Student access updated.' });
      fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Failed to update student access' });
    }
  };

  // Course Settings Save
  const handleSaveCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.updateCourse(courseForm);
      setSaveSuccessMsg('Course settings updated successfully.');
      setTimeout(() => setSaveSuccessMsg(null), 3000);
      fetchAdminData();
      onRefreshData();
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Failed to update course' });
    }
  };

  // Export Full JSON Backup
  const handleExportBackup = async () => {
    try {
      const backup = await api.exportBackup();
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `kphube-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      setBackupStatusMsg('Full JSON backup downloaded successfully.');
      setTimeout(() => setBackupStatusMsg(null), 4000);
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Failed to export backup' });
    }
  };

  // Restore Full JSON Backup
  const handleRestoreBackup = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const json = JSON.parse(text);
      const res = await api.restoreBackup(json);
      setBackupStatusMsg(res.message);
      fetchAdminData();
      onRefreshData();
      setTimeout(() => setBackupStatusMsg(null), 5000);
    } catch (err: any) {
      setAdminToast({ type: 'error', text: err.message || 'Invalid backup file' });
    } finally {
      e.target.value = '';
    }
  };

  // Unauthenticated Admin Lock Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-3xl shadow-xl border border-slate-200 p-6 sm:p-8 space-y-6 text-center">
          <div className="w-14 h-14 rounded-2xl bg-purple-900 text-amber-400 flex items-center justify-center mx-auto shadow-md">
            <Key className="w-7 h-7" />
          </div>

          <div className="space-y-1">
            <h2 className="font-brand font-black text-xl text-slate-900">
              KP HUBE Owner Portal
            </h2>
            <p className="text-xs text-slate-500">
              Role-Based Access Control: Enter your Master Admin Secret Key to manage the course.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4 text-left">
            {loginError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
                {loginError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Admin Master Secret Key
              </label>
              <input
                type="password"
                value={secretKeyInput}
                onChange={(e) => setSecretKeyInput(e.target.value)}
                placeholder="Enter ADMIN_SECRET_KEY"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:border-purple-600 focus:ring-2 focus:ring-purple-100 text-sm focus:outline-none"
                autoFocus
                required
              />
              <p className="text-[11px] text-slate-400 mt-1">
                Configured in <code>.env.example</code> (Default: <code>kphube_admin_2026_secret</code>)
              </p>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onExit}
                className="flex-1 h-11 rounded-xl border border-slate-200 text-slate-700 font-semibold text-xs hover:bg-slate-50 transition-colors"
              >
                Back to App
              </button>
              <button
                type="submit"
                disabled={loginLoading || !secretKeyInput.trim()}
                className="flex-1 h-11 rounded-xl bg-purple-800 hover:bg-purple-900 text-white font-semibold text-xs shadow-md shadow-purple-800/20 transition-all flex items-center justify-center"
              >
                {loginLoading ? 'Verifying...' : 'Unlock Portal'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-24 animate-fade-in max-w-6xl mx-auto">
      {/* Top Admin Navigation Header */}
      <div className="bg-slate-900 text-white rounded-3xl p-5 sm:p-6 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400 text-purple-950 flex items-center justify-center font-bold text-sm">
            KP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-brand font-black text-lg text-white">Owner Admin Dashboard</h1>
              <span className="text-[10px] font-bold text-amber-300 bg-purple-800/80 px-2 py-0.5 rounded border border-purple-700">
                RBAC ACTIVE
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Managing: <strong>KP HUBE Complete YouTube Course</strong> (₹{course?.price || 499})
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-center">
          <button
            onClick={fetchAdminData}
            title="Refresh Server Data"
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={onExit}
            className="px-3 py-1.5 text-xs font-medium bg-slate-800 hover:bg-slate-700 rounded-xl text-slate-300 transition-colors"
          >
            View Student App
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-900/60 hover:bg-rose-900 text-rose-200 border border-rose-800 rounded-xl transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Lock</span>
          </button>
        </div>
      </div>

      {/* Admin Inline Toast Banner */}
      {adminToast && (
        <div
          className={`p-3.5 rounded-2xl border text-xs flex items-center justify-between gap-3 ${
            adminToast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <span className="font-semibold">{adminToast.text}</span>
          <button
            onClick={() => setAdminToast(null)}
            className="p-1 rounded-lg hover:bg-black/5 shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Admin Tab Navigation */}
      <div className="flex overflow-x-auto gap-1.5 p-1.5 bg-white rounded-2xl border border-slate-200 shadow-xs text-xs font-medium scrollbar-none">
        {[
          { id: 'overview', label: 'Overview', icon: LayoutDashboard },
          { id: 'lessons', label: `${lessons.length || 5} Episodes Manager`, icon: BookOpen },
          { id: 'students', label: 'Students Roster', icon: Users },
          { id: 'payments', label: 'Transactions & Fraud Log', icon: CreditCard },
          { id: 'course', label: 'Course Settings & Founder', icon: Settings },
          { id: 'apk', label: 'Android APK Studio Guide', icon: Smartphone }
        ].map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-purple-700 text-white font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ================= TAB 1: OVERVIEW ================= */}
      {activeTab === 'overview' && overview && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Revenue
              </span>
              <span className="font-brand font-black text-2xl text-purple-900 mt-1 block">
                ₹{overview.totalRevenue.toLocaleString('en-IN')}
              </span>
              <span className="text-[10px] text-slate-500">₹{overview.coursePrice || 499} per verified student</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Enrolled Students
              </span>
              <span className="font-brand font-black text-2xl text-emerald-700 mt-1 block">
                {overview.enrolledStudents}
              </span>
              <span className="text-[10px] text-slate-500">Active Course Access</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Total Registered
              </span>
              <span className="font-brand font-black text-2xl text-slate-800 mt-1 block">
                {overview.totalStudents}
              </span>
              <span className="text-[10px] text-slate-500">Saved Student Accounts</span>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider block">
                Published Lessons
              </span>
              <span className="font-brand font-black text-2xl text-purple-700 mt-1 block">
                {overview.publishedLessons} / {overview.totalLessons}
              </span>
              <span className="text-[10px] text-slate-500">Roman Hindi Curriculum</span>
            </div>
          </div>

          {/* Quick Status Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Payee Verification & Safety Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center gap-2 text-purple-900 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-amber-500" />
                <span>Verified Payee Enforcement</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                App is configured with verified VPA <code className="bg-purple-50 px-1.5 py-0.5 rounded font-mono font-bold text-purple-800">kailash100k@axl</code> (Payee: <strong>KP HUBE</strong>). 
                Any mismatched QR image (e.g. Lila) is explicitly blocked from the server to prevent fraudulent enrollments.
              </p>
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">Gateway Signature Check:</span>
                <span className="font-bold text-emerald-700">HMAC-SHA256 Active</span>
              </div>
            </div>

            {/* Support Tickets Overview */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Student Support Queries</span>
                <span className="text-xs text-purple-700 font-semibold">{supportTickets.length} Received</span>
              </div>
              {supportTickets.length === 0 ? (
                <p className="text-xs text-slate-500">No open student questions.</p>
              ) : (
                <div className="space-y-2">
                  {supportTickets.slice(0, 3).map(ticket => (
                    <div key={ticket.id} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs flex justify-between items-center">
                      <div>
                        <span className="font-bold text-slate-800 block">{ticket.subject}</span>
                        <span className="text-[10px] text-slate-500">
                          {ticket.studentPhone?.includes('@') ? ticket.studentPhone : `+91 ${ticket.studentPhone}`} • {ticket.studentName}
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                        {ticket.status}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 2: LESSONS MANAGER ================= */}
      {activeTab === 'lessons' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-brand font-bold text-lg text-slate-900">{lessons.length} Course Episodes Manager</h2>
              <p className="text-xs text-slate-500">Upload video links (YouTube, Google Drive, or MP4), attach PDFs, reorder, or edit episode titles</p>
            </div>
            <button
              onClick={() => {
                setIsNewLesson(true);
                setEditingLesson({
                  title: `Episode ${lessons.length + 1}`,
                  englishSubtitle: '',
                  description: '',
                  durationMinutes: 0,
                  videoUrl: '',
                  videoType: 'awaiting_upload',
                  pdfUrl: '',
                  pdfTitle: '',
                  isPublished: true,
                  isFreePreview: false
                });
              }}
              className="px-4 py-2 bg-purple-700 hover:bg-purple-800 text-white font-semibold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Episode</span>
            </button>
          </div>

          {/* Delete Episode Confirmation Modal */}
          {confirmDeleteLesson && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-sm space-y-4 text-xs">
                <h3 className="font-brand font-bold text-sm text-slate-900">Delete Episode?</h3>
                <p className="text-slate-600">
                  Are you sure you want to delete <strong>"{confirmDeleteLesson.title}"</strong>?
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteLesson(null)}
                    className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteLesson}
                    className="flex-1 h-9 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold"
                  >
                    Confirm Delete
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Lesson Edit/Create Modal */}
          {editingLesson && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl border border-slate-100 p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <h3 className="font-brand font-bold text-base text-slate-900">
                    {isNewLesson ? 'Add New Episode' : `Edit Episode #${editingLesson.order}`}
                  </h3>
                  <button onClick={() => setEditingLesson(null)} className="p-1 rounded-full text-slate-400 hover:text-slate-700">
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <form onSubmit={handleSaveLesson} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Episode Title
                    </label>
                    <input
                      type="text"
                      value={editingLesson.title || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                      placeholder="e.g. Episode 2"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Subtitle / Topic (Optional)
                    </label>
                    <input
                      type="text"
                      value={editingLesson.englishSubtitle || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, englishSubtitle: e.target.value })}
                      placeholder="e.g. Channel Setup & Niche Selection"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Duration (Minutes)</label>
                      <input
                        type="number"
                        min={0}
                        value={editingLesson.durationMinutes ?? 0}
                        onChange={(e) => setEditingLesson({ ...editingLesson, durationMinutes: Number(e.target.value) })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">Video Stream Type</label>
                      <select
                        value={editingLesson.videoType || 'awaiting_upload'}
                        onChange={(e) => setEditingLesson({ ...editingLesson, videoType: e.target.value as any })}
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none bg-white"
                      >
                        <option value="awaiting_upload">Awaiting Upload (No Video Yet)</option>
                        <option value="youtube">YouTube (Unlisted / Public)</option>
                        <option value="mp4">Direct MP4 / HLS Video URL</option>
                        <option value="drive">Google Drive Video Link</option>
                        <option value="vimeo">Vimeo Embed</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">
                      Video Playback URL / Link
                    </label>
                    <input
                      type="text"
                      value={editingLesson.videoUrl || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, videoUrl: e.target.value })}
                      placeholder="https://youtu.be/... or https://domain.com/video.mp4"
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                    />
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      Leave empty if video is awaiting recording/upload. The app will cleanly state "Awaiting Upload".
                    </p>
                  </div>

                  <div>
                    <label className="block font-semibold text-slate-700 mb-1">Lesson Description</label>
                    <textarea
                      rows={3}
                      value={editingLesson.description || ''}
                      onChange={(e) => setEditingLesson({ ...editingLesson, description: e.target.value })}
                      placeholder="What students will learn in this lesson..."
                      className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">PDF Study Material URL</label>
                      <input
                        type="text"
                        value={editingLesson.pdfUrl || ''}
                        onChange={(e) => setEditingLesson({ ...editingLesson, pdfUrl: e.target.value })}
                        placeholder="https://drive.google.com/..."
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold text-slate-700 mb-1">PDF Title</label>
                      <input
                        type="text"
                        value={editingLesson.pdfTitle || ''}
                        onChange={(e) => setEditingLesson({ ...editingLesson, pdfTitle: e.target.value })}
                        placeholder="e.g. YouTube Setup Checklist PDF"
                        className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:border-purple-600 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={editingLesson.isPublished !== false}
                        onChange={(e) => setEditingLesson({ ...editingLesson, isPublished: e.target.checked })}
                        className="w-4 h-4 text-purple-600 rounded"
                      />
                      <span className="font-semibold text-slate-700">Published (Visible to students)</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={Boolean(editingLesson.isFreePreview)}
                        onChange={(e) => setEditingLesson({ ...editingLesson, isFreePreview: e.target.checked })}
                        className="w-4 h-4 text-emerald-600 rounded"
                      />
                      <span className="font-semibold text-slate-700">Free Preview (Unlocked before payment)</span>
                    </label>
                  </div>

                  <div className="flex gap-2 pt-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setEditingLesson(null)}
                      className="flex-1 h-10 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 h-10 rounded-xl bg-purple-700 text-white font-semibold shadow-sm hover:bg-purple-800"
                    >
                      Save Lesson
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* Lessons List Table */}
          <div className="space-y-2">
            {lessons.map((lesson, idx) => (
              <div
                key={lesson.id}
                className="p-3.5 rounded-xl border border-slate-200 hover:border-slate-300 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-0.5">
                    <button
                      onClick={() => handleMoveLesson(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1 hover:bg-slate-100 disabled:opacity-20 rounded text-slate-500"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      onClick={() => handleMoveLesson(idx, 'down')}
                      disabled={idx === lessons.length - 1}
                      className="p-1 hover:bg-slate-100 disabled:opacity-20 rounded text-slate-500"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                  </div>

                  <span className="font-mono font-bold text-xs text-purple-900 bg-purple-50 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                    {String(lesson.order).padStart(2, '0')}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-900">{lesson.title}</span>
                      {lesson.isFreePreview && (
                        <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded font-bold">
                          Free Preview
                        </span>
                      )}
                      {!lesson.isPublished && (
                        <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.2 rounded">
                          Hidden
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-slate-500 text-[11px] mt-0.5">
                      <span>{lesson.durationMinutes}m</span>
                      <span>·</span>
                      <span>{lesson.videoUrl ? 'Video Configured' : 'Awaiting Video File'}</span>
                      {lesson.pdfUrl && (
                        <>
                          <span>·</span>
                          <span className="text-purple-700">PDF Attached</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <button
                    onClick={() => handleTogglePublish(lesson)}
                    className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                    title={lesson.isPublished ? "Hide from students" : "Publish to students"}
                  >
                    {lesson.isPublished ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5 text-slate-400" />}
                  </button>

                  <button
                    onClick={() => {
                      setIsNewLesson(false);
                      setEditingLesson({ ...lesson });
                    }}
                    className="p-1.5 rounded-lg border border-slate-200 text-purple-700 hover:bg-purple-50"
                    title="Edit Lesson"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => setConfirmDeleteLesson({ id: lesson.id, title: lesson.title })}
                    className="p-1.5 rounded-lg border border-slate-200 text-rose-600 hover:bg-rose-50"
                    title="Delete Episode"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ================= TAB 3: STUDENTS ROSTER ================= */}
      {activeTab === 'students' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-brand font-bold text-lg text-slate-900">Registered Students Roster</h2>
              <p className="text-xs text-slate-500">Manage course access, view phone numbers, and grant/revoke access</p>
            </div>
            <span className="text-xs font-mono font-semibold text-purple-800 bg-purple-50 px-3 py-1 rounded-lg">
              {students.length} Total Users
            </span>
          </div>

          {/* Action Confirmation Modal */}
          {selectedStudentForAction && actionType && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
              <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm space-y-4 text-xs">
                <h3 className="font-brand font-bold text-sm text-slate-900">
                  {actionType === 'grant' ? 'Grant Course Access' : 'Revoke Course Access'}
                </h3>
                <p className="text-slate-600">
                  Target Student: <strong>{selectedStudentForAction.email || (selectedStudentForAction.phone ? `+91 ${selectedStudentForAction.phone}` : selectedStudentForAction.id)}</strong> ({selectedStudentForAction.name || 'Unnamed'})
                </p>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Audit Note / Reason (Required):
                  </label>
                  <input
                    type="text"
                    placeholder={actionType === 'grant' ? 'e.g. Offline cash or verified UPI transfer' : 'e.g. Refund issued'}
                    value={grantReason}
                    onChange={(e) => setGrantReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                    autoFocus
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setSelectedStudentForAction(null); setActionType(null); }}
                    className="flex-1 h-9 rounded-xl border border-slate-200 text-slate-700 font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleStudentAccessConfirm}
                    disabled={!grantReason.trim()}
                    className={`flex-1 h-9 rounded-xl text-white font-semibold disabled:opacity-50 ${
                      actionType === 'grant' ? 'bg-purple-700 hover:bg-purple-800' : 'bg-rose-700 hover:bg-rose-800'
                    }`}
                  >
                    Confirm {actionType === 'grant' ? 'Grant' : 'Revoke'}
                  </button>
                </div>
              </div>
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 text-left font-semibold">
                  <th className="py-2.5 px-3">Student Name / Phone</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3">Progress</th>
                  <th className="py-2.5 px-3">Joined Date</th>
                  <th className="py-2.5 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-slate-900">{s.name || 'Student Creator'}</div>
                      <div className="font-mono text-slate-500 text-[11px]">
                        {s.email || (s.phone ? `+91 ${s.phone}` : s.id)}
                      </div>
                    </td>
                    <td className="py-3 px-3">
                      {s.isEnrolled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Enrolled
                        </span>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                          Unpaid
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-3 font-mono">
                      {s.completedLessonIds.length} / {lessons.length}
                    </td>
                    <td className="py-3 px-3 text-slate-500">
                      {new Date(s.createdAt).toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric'
                      })}
                    </td>
                    <td className="py-3 px-3 text-right">
                      {s.isEnrolled ? (
                        <button
                          onClick={() => { setSelectedStudentForAction(s); setActionType('revoke'); }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg border border-rose-200"
                        >
                          Revoke Access
                        </button>
                      ) : (
                        <button
                          onClick={() => { setSelectedStudentForAction(s); setActionType('grant'); }}
                          className="px-2.5 py-1 text-[11px] font-semibold text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200"
                        >
                          Grant Access
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ================= TAB 4: TRANSACTIONS & AUDIT ================= */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <h2 className="font-brand font-bold text-lg text-slate-900">Payment Ledger & Audit Trail</h2>
              <p className="text-xs text-slate-500">Cryptographically verified orders and fraud prevention logs</p>
            </div>
            <span className="text-xs font-semibold text-slate-600 font-mono">
              {payments.length} Transactions
            </span>
          </div>

          <div className="space-y-3">
            {payments.map(p => (
              <div key={p.id} className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/50 text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900">₹{p.amount}</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      p.status === 'paid' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-800'
                    }`}>
                      {p.status.toUpperCase()}
                    </span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-600">
                      {p.studentPhone?.includes('@') ? p.studentPhone : `+91 ${p.studentPhone}`}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Order: {p.orderId} {p.paymentId ? `| Gateway Ref: ${p.paymentId}` : ''}
                  </div>
                </div>

                <div className="text-right text-[11px] text-slate-400">
                  <span>{new Date(p.timestamp).toLocaleString('en-IN')}</span>
                  {p.receiptNumber && (
                    <span className="block font-mono text-purple-700 font-semibold">{p.receiptNumber}</span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Audit Logs list */}
          <div className="pt-4 border-t border-slate-100">
            <h3 className="font-brand font-bold text-sm text-slate-900 mb-2">System Audit Records</h3>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {auditLogs.map(log => (
                <div key={log.id} className="p-2 bg-slate-100/70 rounded-lg text-[11px] text-slate-600 flex justify-between">
                  <span>
                    <strong className="text-purple-950 font-mono">{log.action}:</strong> {log.details}
                  </span>
                  <span className="font-mono text-slate-400 shrink-0 ml-2">
                    {new Date(log.timestamp).toLocaleTimeString('en-IN')}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 5: COURSE SETTINGS & FOUNDER ================= */}
      {activeTab === 'course' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-4">
          <div className="border-b border-slate-100 pb-3">
            <h2 className="font-brand font-bold text-lg text-slate-900">Course & Founder Settings</h2>
            <p className="text-xs text-slate-500">Configure course price (default ₹499), description, and founder portrait</p>
          </div>

          {saveSuccessMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveSuccessMsg}</span>
            </div>
          )}

          <form onSubmit={handleSaveCourse} className="space-y-4 text-xs">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Course Name</label>
                <input
                  type="text"
                  value={courseForm.title || ''}
                  onChange={(e) => setCourseForm({ ...courseForm, title: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tagline</label>
                <input
                  type="text"
                  value={courseForm.tagline || ''}
                  onChange={(e) => setCourseForm({ ...courseForm, tagline: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Selling Price (INR ₹)</label>
                <input
                  type="number"
                  min={1}
                  value={courseForm.price || 499}
                  onChange={(e) => setCourseForm({ ...courseForm, price: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none font-bold text-purple-900"
                  required
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Original Price (Strike-through)</label>
                <input
                  type="number"
                  min={1}
                  value={courseForm.originalPrice || 1999}
                  onChange={(e) => setCourseForm({ ...courseForm, originalPrice: Number(e.target.value) })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Course Description</label>
              <textarea
                rows={3}
                value={courseForm.description || ''}
                onChange={(e) => setCourseForm({ ...courseForm, description: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">
                Founder Portrait Image Path / URL
              </label>
              <input
                type="text"
                value={courseForm.bannerImage || ''}
                onChange={(e) => setCourseForm({ ...courseForm, bannerImage: e.target.value })}
                placeholder="/assets/founder.jpg or WhatsApp Image 2026-11-11 at 12.28.57 AM.jpeg"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none font-mono"
              />
              <p className="text-[10px] text-slate-500 mt-1">
                Your attached photo: Place <code>WhatsApp Image 2026-11-11 at 12.28.57 AM.jpeg</code> in <code>public/assets/founder.jpg</code>.
              </p>
            </div>

            <div>
              <label className="block font-semibold text-slate-700 mb-1">Founder Role & Bio</label>
              <input
                type="text"
                value={courseForm.founderRole || ''}
                onChange={(e) => setCourseForm({ ...courseForm, founderRole: e.target.value })}
                placeholder="YouTube Growth Specialist & Content Creator"
                className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="px-6 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-semibold rounded-xl flex items-center gap-2 shadow-sm transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>Save Course Settings</span>
            </button>
          </form>

          {/* Database Backup & Restore */}
          <div className="pt-5 border-t border-slate-200 space-y-3">
            <div>
              <h3 className="font-brand font-bold text-sm text-slate-900">Data Backup & Restore (.JSON)</h3>
              <p className="text-[11px] text-slate-500">
                Download a complete snapshot of your course, lessons, students, and payments, or restore from a previous backup anytime.
              </p>
            </div>
            {backupStatusMsg && (
              <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800">
                {backupStatusMsg}
              </div>
            )}
            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={handleExportBackup}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-xl transition-colors"
              >
                Download Backup (.JSON)
              </button>
              <label className="px-4 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold rounded-xl cursor-pointer transition-colors">
                <span>Restore from Backup (.JSON)</span>
                <input
                  type="file"
                  accept=".json,application/json"
                  onChange={handleRestoreBackup}
                  className="hidden"
                />
              </label>
            </div>
          </div>
        </div>
      )}

      {/* ================= TAB 6: ANDROID APK BUILD GUIDE ================= */}
      {activeTab === 'apk' && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200 space-y-5">
          <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
            <div>
              <h2 className="font-brand font-bold text-lg text-slate-900">Capacitor Android Studio APK Guide</h2>
              <p className="text-xs text-slate-500">Step-by-step instructions to compile and build the installable Android APK</p>
            </div>
            <span className="font-mono text-xs font-bold text-purple-700 bg-purple-50 px-3 py-1 rounded-lg">
              com.kphube.app
            </span>
          </div>

          <div className="p-4 bg-purple-50/70 border border-purple-200 rounded-2xl text-xs space-y-2">
            <span className="font-bold text-purple-950 block">Android Project Configuration Status:</span>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-purple-900">
              <div>• Package ID: <code>com.kphube.app</code></div>
              <div>• App Name: <code>KP HUBE</code></div>
              <div>• Status Bar Color: <code>#5B21B6</code> (Dark purple)</div>
              <div>• Splash Screen: Centered KP HUBE logo</div>
              <div>• Safe Area Insets: Configured for Android gesture bar</div>
              <div>• Min SDK: 22 (Android 5.1+) | Target SDK: 34 (Android 14)</div>
            </div>
          </div>

          {/* 1. Publish Public .APK File or URL (What visitors download) */}
          <div className="p-5 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-4 text-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <span className="font-bold text-indigo-950 text-sm block">Public APK Release (Visitors Download .APK Only)</span>
                <p className="text-[11px] text-indigo-800 mt-0.5">
                  Upload your compiled <code>app-debug.apk</code> / <code>app-release.apk</code> OR paste your GitHub Release direct <code>.apk</code> link. Only when set will visitors see the <strong>Download APK</strong> button.
                </p>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold shrink-0 ${
                hasUploadedApk || apkUrlInput
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-amber-100 text-amber-800'
              }`}>
                {hasUploadedApk
                  ? `APK Uploaded (${(uploadedApkSize / (1024 * 1024)).toFixed(2)} MB)`
                  : apkUrlInput
                    ? 'External APK Link Active'
                    : 'No APK Published Yet'}
              </span>
            </div>

            {apkStatusMsg && (
              <div className="p-2.5 bg-white border border-indigo-200 rounded-xl text-indigo-900 font-medium">
                {apkStatusMsg}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-3">
              <label className="px-4 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-800 text-white font-bold text-xs cursor-pointer transition-all shadow-sm">
                <span>{apkSaving ? 'Uploading...' : 'Upload .APK File'}</span>
                <input
                  type="file"
                  accept=".apk,application/vnd.android.package-archive"
                  disabled={apkSaving}
                  className="hidden"
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    setApkSaving(true);
                    setApkStatusMsg(null);
                    try {
                      const reader = new FileReader();
                      const base64: string = await new Promise((resolve, reject) => {
                        reader.onload = () => resolve(String(reader.result || ''));
                        reader.onerror = () => reject(new Error('Failed to read APK file'));
                        reader.readAsDataURL(file);
                      });
                      const res = await api.uploadAdminApk(file.name, base64);
                      setHasUploadedApk(true);
                      setUploadedApkSize(res.size);
                      setApkStatusMsg('APK uploaded privately & published for visitors (KP-HUBE.apk).');
                      onRefreshData();
                    } catch (err: any) {
                      setApkStatusMsg(err.message || 'APK upload failed');
                    } finally {
                      setApkSaving(false);
                      e.target.value = '';
                    }
                  }}
                />
              </label>

              {hasUploadedApk && (
                <button
                  type="button"
                  disabled={apkSaving}
                  onClick={async () => {
                    setApkSaving(true);
                    try {
                      await api.deleteAdminApk();
                      setHasUploadedApk(false);
                      setUploadedApkSize(0);
                      setApkStatusMsg('Uploaded APK removed.');
                      onRefreshData();
                    } finally {
                      setApkSaving(false);
                    }
                  }}
                  className="px-3.5 py-2 rounded-xl border border-rose-300 text-rose-700 hover:bg-rose-50 font-semibold text-xs"
                >
                  Remove Uploaded APK
                </button>
              )}
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setApkSaving(true);
                setApkStatusMsg(null);
                try {
                  const res = await api.updateAdminApkUrl(apkUrlInput.trim());
                  setApkUrlInput(res.apkDownloadUrl);
                  setApkStatusMsg(res.apkDownloadUrl ? 'External APK download URL saved.' : 'External APK URL cleared.');
                  onRefreshData();
                } catch (err: any) {
                  setApkStatusMsg(err.message || 'Failed to save URL');
                } finally {
                  setApkSaving(false);
                }
              }}
              className="flex flex-col sm:flex-row gap-2 pt-1"
            >
              <input
                type="url"
                value={apkUrlInput}
                onChange={(e) => setApkUrlInput(e.target.value)}
                placeholder="https://github.com/your-user/your-repo/releases/latest/download/app-debug.apk"
                className="flex-1 px-3 py-2 rounded-xl border border-indigo-200 bg-white focus:border-indigo-500 focus:outline-none font-mono text-[11px]"
              />
              <button
                type="submit"
                disabled={apkSaving}
                className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shrink-0"
              >
                Save APK Link
              </button>
            </form>
          </div>

          {/* 2. Private Owner-Only Android Project ZIP Download */}
          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div>
              <span className="font-bold text-emerald-950 text-sm block">Private Owner Archive: Android Project (.ZIP)</span>
              <p className="text-[11px] text-emerald-800 mt-0.5">
                Protected by your Admin key — completely hidden from public users. Only you can download the source project ZIP.
              </p>
            </div>
            <button
              type="button"
              onClick={async () => {
                try {
                  await api.downloadPrivateAndroidProjectZip();
                } catch (err: any) {
                  setApkStatusMsg(err.message || 'Failed to download private ZIP.');
                }
              }}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold text-xs flex items-center gap-2 shadow-md shrink-0 transition-all"
            >
              <Smartphone className="w-4 h-4" />
              <span>Download Private Project (.ZIP)</span>
            </button>
          </div>

          {/* Step by Step Execution Instructions */}
          <div className="space-y-4 text-xs text-slate-700">
            <h3 className="font-brand font-bold text-sm text-slate-900">Build & Run Commands:</h3>

            <div className="space-y-3">
              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-slate-400"># 1. Build the production web bundle</div>
                <div>npm run build</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-slate-400"># 2. Sync web assets and plugins to Android platform</div>
                <div>npx cap sync android</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-slate-400"># 3. Open project directly in Android Studio</div>
                <div>npx cap open android</div>
              </div>

              <div className="p-3 bg-slate-900 text-slate-200 rounded-xl font-mono text-[11px] space-y-1">
                <div className="text-slate-400"># 4. Generate Debug APK directly from terminal (if Android SDK is installed)</div>
                <div>cd android && ./gradlew assembleDebug</div>
                <div className="text-emerald-400"># APK output: android/app/build/outputs/apk/debug/app-debug.apk</div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <span className="font-bold text-slate-900 block">Android Studio GUI Steps for Signed Release APK:</span>
              <ol className="list-decimal list-inside space-y-1 text-slate-600 text-[11px]">
                <li>Launch <strong>Android Studio</strong> and select <strong>Open Project</strong> → select the <code>android</code> folder of this codebase.</li>
                <li>Wait for Gradle sync to complete successfully.</li>
                <li>Click <strong>Build</strong> menu at top → select <strong>Generate Signed Bundle / APK...</strong></li>
                <li>Choose <strong>APK</strong> → click <strong>Next</strong>.</li>
                <li>Choose your Keystore (or click <em>Create new...</em> if creating your first key).</li>
                <li>Select <strong>release</strong> build variant and check <strong>V2 (Full APK Signature)</strong>.</li>
                <li>Click <strong>Finish</strong>. Your installable <code>app-release.apk</code> will be created!</li>
              </ol>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
