import type { Course, Lesson, Student, PaymentRecord, AuditLog, SupportTicket } from '../types/index.ts';
import { isNativeCapacitorApp } from '../hooks/usePWAInstall.ts';

const STUDENT_PHONE_KEY = 'kphube_student_phone';
const ADMIN_TOKEN_KEY = 'kphube_admin_token';

const DEFAULT_NATIVE_API_BASE = 'https://ais-pre-oifnthjmv5hmrg4o4n7nk3-37682163655.asia-northeast1.run.app';

export function apiUrl(path: string): string {
  const configured = (import.meta as unknown as { env?: Record<string, string | undefined> }).env?.VITE_API_BASE_URL;
  if (configured) {
    return `${configured.replace(/\/+$/, '')}${path}`;
  }
  if (isNativeCapacitorApp()) {
    return `${DEFAULT_NATIVE_API_BASE}${path}`;
  }
  return path;
}

export const storage = {
  getStudentPhone(): string | null {
    return localStorage.getItem(STUDENT_PHONE_KEY);
  },
  setStudentPhone(phone: string) {
    localStorage.setItem(STUDENT_PHONE_KEY, phone);
  },
  removeStudentPhone() {
    localStorage.removeItem(STUDENT_PHONE_KEY);
  },
  getAdminToken(): string | null {
    return localStorage.getItem(ADMIN_TOKEN_KEY);
  },
  setAdminToken(token: string) {
    localStorage.setItem(ADMIN_TOKEN_KEY, token);
  },
  removeAdminToken() {
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
};

function getHeaders(isAdmin = false): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json'
  };
  const phone = storage.getStudentPhone();
  if (phone) {
    headers['Authorization'] = `Bearer ${phone}`;
    headers['x-student-phone'] = phone;
  }
  if (isAdmin) {
    const adminToken = storage.getAdminToken();
    if (adminToken) {
      headers['x-admin-token'] = adminToken;
    }
  }
  return headers;
}

export const api = {
  // Course
  async getCourse(): Promise<{ course: Course; totalLessons: number }> {
    const res = await fetch(apiUrl('/api/course'));
    if (!res.ok) throw new Error('Failed to load course details');
    return res.json();
  },

  // Lessons (Server automatically censors locked videos for non-enrolled students)
  async getLessons(): Promise<{ lessons: Lesson[]; isEnrolled: boolean; studentPhone?: string }> {
    const res = await fetch(apiUrl('/api/lessons'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch lessons');
    return res.json();
  },

  // Progress
  async updateLessonProgress(lessonId: string, completed: boolean): Promise<{ success: boolean; completedLessonIds: string[] }> {
    const res = await fetch(apiUrl(`/api/lessons/${lessonId}/progress`), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ completed })
    });
    if (!res.ok) throw new Error('Failed to update lesson progress');
    return res.json();
  },

  // Auth (No OTP — Instant Gmail/Email or Mobile Number + Password)
  async register(payload: {
    identifier?: string;
    email?: string;
    phone?: string;
    password: string;
    name?: string;
  }): Promise<{ success: boolean; token: string; student: Student }> {
    const res = await fetch(apiUrl('/api/auth/register'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to create account');
    storage.setStudentPhone(data.token);
    return data;
  },

  async login(payload: {
    identifier: string;
    password: string;
  }): Promise<{ success: boolean; token: string; student: Student }> {
    const res = await fetch(apiUrl('/api/auth/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to sign in');
    storage.setStudentPhone(data.token);
    return data;
  },

  async getMe(): Promise<{ student: Student }> {
    const res = await fetch(apiUrl('/api/auth/me'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Not logged in');
    return res.json();
  },

  async updateProfile(name: string): Promise<{ success: boolean; student: Student }> {
    const res = await fetch(apiUrl('/api/auth/profile'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await fetch(apiUrl('/api/auth/delete-account'), {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete account');
    storage.removeStudentPhone();
    return data;
  },

  // Payments
  async getUpiStatus(): Promise<{
    verifiedPayeeName: string;
    verifiedUpiVpa: string;
    courseAmount: number;
    hasLiveGatewayKeys: boolean;
    razorpayKeyId: string;
    mismatchedQrBlocked: boolean;
  }> {
    const res = await fetch(apiUrl('/api/payment/upi-status'));
    if (!res.ok) throw new Error('Failed to fetch payment status');
    return res.json();
  },

  async createOrder(): Promise<{
    success: boolean;
    orderId: string;
    amount: number;
    amountRupees: number;
    currency: string;
    receiptNumber: string;
    key: string;
    courseTitle: string;
    studentPhone: string;
    studentName: string;
    qrImageUrl?: string;
    upiVpa?: string;
    upiIntentUrl?: string;
  }> {
    const res = await fetch(apiUrl('/api/payment/create-order'), {
      method: 'POST',
      headers: getHeaders()
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Order creation failed');
    return data;
  },

  async verifyPayment(payload: {
    orderId: string;
    paymentId: string;
    signature?: string;
    clientPayeeClaim?: string;
  }): Promise<{ success: boolean; message: string; receiptNumber: string; isEnrolled: boolean }> {
    const res = await fetch(apiUrl('/api/payment/verify'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment verification failed');
    return data;
  },

  async getPaymentHistory(): Promise<{ payments: PaymentRecord[] }> {
    const res = await fetch(apiUrl('/api/payment/history'), { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch payment history');
    return res.json();
  },

  // Support
  async submitSupport(subject: string, message: string, name?: string, phone?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch(apiUrl('/api/support'), {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ subject, message, name, phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to submit query');
    return data;
  },

  // Admin
  async adminLogin(secretKey: string): Promise<{ success: boolean; adminToken: string }> {
    const res = await fetch(apiUrl('/api/admin/login'), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ secretKey })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Admin verification failed');
    storage.setAdminToken(data.adminToken);
    return data;
  },

  async getAdminOverview(): Promise<{
    totalRevenue: number;
    enrolledStudents: number;
    totalStudents: number;
    pendingPayments: number;
    totalLessons: number;
    publishedLessons: number;
    supportOpenCount: number;
    coursePrice: number;
  }> {
    const res = await fetch(apiUrl('/api/admin/overview'), { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Admin overview fetch failed');
    return res.json();
  },

  async getAdminStudents(): Promise<{ students: (Student & { purchaseRecord?: PaymentRecord })[] }> {
    const res = await fetch(apiUrl('/api/admin/students'), { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch student roster');
    return res.json();
  },

  async grantStudentAccess(studentId: string, reason: string): Promise<{ success: boolean; student: Student }> {
    const res = await fetch(apiUrl(`/api/admin/students/${studentId}/grant`), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to grant access');
    return data;
  },

  async revokeStudentAccess(studentId: string, reason: string): Promise<{ success: boolean; student: Student }> {
    const res = await fetch(apiUrl(`/api/admin/students/${studentId}/revoke`), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to revoke access');
    return data;
  },

  async getAdminPayments(): Promise<{ payments: PaymentRecord[] }> {
    const res = await fetch(apiUrl('/api/admin/payments'), { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch payment ledger');
    return res.json();
  },

  async updateCourse(updates: Partial<Course>): Promise<{ success: boolean; course: Course }> {
    const res = await fetch(apiUrl('/api/admin/course'), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update course');
    return data;
  },

  async addLesson(lessonData: Partial<Lesson>): Promise<{ success: boolean; lesson: Lesson }> {
    const res = await fetch(apiUrl('/api/admin/lessons'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(lessonData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add lesson');
    return data;
  },

  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<{ success: boolean; lesson: Lesson }> {
    const res = await fetch(apiUrl(`/api/admin/lessons/${lessonId}`), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update lesson');
    return data;
  },

  async deleteLesson(lessonId: string): Promise<{ success: boolean }> {
    const res = await fetch(apiUrl(`/api/admin/lessons/${lessonId}`), {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete lesson');
    return data;
  },

  async reorderLessons(orderedIds: string[]): Promise<{ success: boolean; lessons: Lesson[] }> {
    const res = await fetch(apiUrl('/api/admin/lessons/reorder'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ orderedIds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reorder lessons');
    return data;
  },

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    const res = await fetch(apiUrl('/api/admin/audit-logs'), { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getSupportTickets(): Promise<{ tickets: SupportTicket[] }> {
    const res = await fetch(apiUrl('/api/admin/support'), { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch support tickets');
    return res.json();
  },

  async resolveSupportTicket(ticketId: string): Promise<{ success: boolean }> {
    const res = await fetch(apiUrl(`/api/admin/support/${ticketId}/resolve`), {
      method: 'POST',
      headers: getHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve ticket');
    return data;
  },

  async exportBackup(): Promise<{ exportedAt: string; app: string; data: unknown }> {
    const res = await fetch(apiUrl('/api/admin/backup'), { headers: getHeaders(true) });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to export backup');
    return data;
  },

  async restoreBackup(backupJson: unknown): Promise<{ success: boolean; message: string }> {
    const res = await fetch(apiUrl('/api/admin/restore'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(backupJson)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to restore backup');
    return data;
  },

  async getApkStatus(): Promise<{ available: boolean; filename: string; downloadUrl: string | null; source: string }> {
    const res = await fetch(apiUrl('/api/apk/status'));
    if (!res.ok) return { available: false, filename: 'KP-HUBE.apk', downloadUrl: null, source: 'none' };
    return res.json();
  },

  async getAdminApkConfig(): Promise<{ apkDownloadUrl: string; hasUploadedApk: boolean; uploadedApkSize: number }> {
    const res = await fetch(apiUrl('/api/admin/apk-config'), { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to load APK settings');
    return res.json();
  },

  async updateAdminApkUrl(apkDownloadUrl: string): Promise<{ success: boolean; apkDownloadUrl: string }> {
    const res = await fetch(apiUrl('/api/admin/apk-config'), {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ apkDownloadUrl })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to save APK URL');
    return data;
  },

  async uploadAdminApk(filename: string, base64: string): Promise<{ success: boolean; size: number }> {
    const res = await fetch(apiUrl('/api/admin/upload-apk'), {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ filename, base64 })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to upload APK');
    return data;
  },

  async deleteAdminApk(): Promise<{ success: boolean }> {
    const res = await fetch(apiUrl('/api/admin/upload-apk'), {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to remove uploaded APK');
    return data;
  },

  async downloadPrivateAndroidProjectZip(): Promise<void> {
    const res = await fetch(apiUrl('/api/admin/android-project'), {
      headers: getHeaders(true)
    });
    if (!res.ok) {
      throw new Error('Unauthorized or archive unavailable.');
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'kphube-android-project.zip';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
};
