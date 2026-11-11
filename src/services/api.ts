import type { Course, Lesson, Student, PaymentRecord, AuditLog, SupportTicket } from '../types/index.ts';

const STUDENT_PHONE_KEY = 'kphube_student_phone';
const ADMIN_TOKEN_KEY = 'kphube_admin_token';

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
    const res = await fetch('/api/course');
    if (!res.ok) throw new Error('Failed to load course details');
    return res.json();
  },

  // Lessons (Server automatically censors locked videos for non-enrolled students)
  async getLessons(): Promise<{ lessons: Lesson[]; isEnrolled: boolean; studentPhone?: string }> {
    const res = await fetch('/api/lessons', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch lessons');
    return res.json();
  },

  // Progress
  async updateLessonProgress(lessonId: string, completed: boolean): Promise<{ success: boolean; completedLessonIds: string[] }> {
    const res = await fetch(`/api/lessons/${lessonId}/progress`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ completed })
    });
    if (!res.ok) throw new Error('Failed to update lesson progress');
    return res.json();
  },

  // Auth
  async sendOtp(phone: string): Promise<{ success: boolean; message: string; devCode?: string }> {
    const res = await fetch('/api/auth/send-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to send OTP');
    return data;
  },

  async verifyOtp(phone: string, code: string, name?: string): Promise<{ success: boolean; token: string; student: Student }> {
    const res = await fetch('/api/auth/verify-otp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, code, name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to verify OTP');
    storage.setStudentPhone(data.token);
    return data;
  },

  async getMe(): Promise<{ student: Student }> {
    const res = await fetch('/api/auth/me', { headers: getHeaders() });
    if (!res.ok) throw new Error('Not logged in');
    return res.json();
  },

  async updateProfile(name: string): Promise<{ success: boolean; student: Student }> {
    const res = await fetch('/api/auth/profile', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update profile');
    return data;
  },

  async deleteAccount(): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/auth/delete-account', {
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
    const res = await fetch('/api/payment/upi-status');
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
    const res = await fetch('/api/payment/create-order', {
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
    const res = await fetch('/api/payment/verify', {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Payment verification failed');
    return data;
  },

  async getPaymentHistory(): Promise<{ payments: PaymentRecord[] }> {
    const res = await fetch('/api/payment/history', { headers: getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch payment history');
    return res.json();
  },

  // Support
  async submitSupport(subject: string, message: string, name?: string, phone?: string): Promise<{ success: boolean; message: string }> {
    const res = await fetch('/api/support', {
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
    const res = await fetch('/api/admin/login', {
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
    const res = await fetch('/api/admin/overview', { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Admin overview fetch failed');
    return res.json();
  },

  async getAdminStudents(): Promise<{ students: (Student & { purchaseRecord?: PaymentRecord })[] }> {
    const res = await fetch('/api/admin/students', { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch student roster');
    return res.json();
  },

  async grantStudentAccess(studentId: string, reason: string): Promise<{ success: boolean; student: Student }> {
    const res = await fetch(`/api/admin/students/${studentId}/grant`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to grant access');
    return data;
  },

  async revokeStudentAccess(studentId: string, reason: string): Promise<{ success: boolean; student: Student }> {
    const res = await fetch(`/api/admin/students/${studentId}/revoke`, {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ reason })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to revoke access');
    return data;
  },

  async getAdminPayments(): Promise<{ payments: PaymentRecord[] }> {
    const res = await fetch('/api/admin/payments', { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch payment ledger');
    return res.json();
  },

  async updateCourse(updates: Partial<Course>): Promise<{ success: boolean; course: Course }> {
    const res = await fetch('/api/admin/course', {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update course');
    return data;
  },

  async addLesson(lessonData: Partial<Lesson>): Promise<{ success: boolean; lesson: Lesson }> {
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify(lessonData)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to add lesson');
    return data;
  },

  async updateLesson(lessonId: string, updates: Partial<Lesson>): Promise<{ success: boolean; lesson: Lesson }> {
    const res = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify(updates)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to update lesson');
    return data;
  },

  async deleteLesson(lessonId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/lessons/${lessonId}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to delete lesson');
    return data;
  },

  async reorderLessons(orderedIds: string[]): Promise<{ success: boolean; lessons: Lesson[] }> {
    const res = await fetch('/api/admin/lessons/reorder', {
      method: 'POST',
      headers: getHeaders(true),
      body: JSON.stringify({ orderedIds })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to reorder lessons');
    return data;
  },

  async getAuditLogs(): Promise<{ logs: AuditLog[] }> {
    const res = await fetch('/api/admin/audit-logs', { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch audit logs');
    return res.json();
  },

  async getSupportTickets(): Promise<{ tickets: SupportTicket[] }> {
    const res = await fetch('/api/admin/support', { headers: getHeaders(true) });
    if (!res.ok) throw new Error('Failed to fetch support tickets');
    return res.json();
  },

  async resolveSupportTicket(ticketId: string): Promise<{ success: boolean }> {
    const res = await fetch(`/api/admin/support/${ticketId}/resolve`, {
      method: 'POST',
      headers: getHeaders(true)
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Failed to resolve ticket');
    return data;
  }
};
