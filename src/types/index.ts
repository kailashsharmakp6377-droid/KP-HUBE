export interface Course {
  id: string;
  title: string;
  tagline: string;
  description: string;
  price: number; // in INR e.g. 499
  originalPrice: number; // in INR e.g. 1999
  bannerImage: string;
  founderName: string; // "Founder & Mentor"
  founderRole: string;
  founderBio: string;
  announcement?: string;
  totalLessons: number;
  enrolledCount: number;
  features: string[];
}

export interface Lesson {
  id: string;
  order: number;
  title: string; // Roman Hindi title
  englishSubtitle: string;
  description: string;
  durationMinutes: number;
  videoUrl?: string; // YouTube, MP4, Vimeo, etc.
  videoType: 'youtube' | 'mp4' | 'vimeo' | 'drive' | 'awaiting_upload';
  pdfUrl?: string;
  pdfTitle?: string;
  isPublished: boolean;
  isFreePreview: boolean;
}

export interface Student {
  id: string;
  phone?: string; // 10 digit Indian number without +91 (optional if signed up with email)
  email?: string; // Gmail / Email address
  name?: string;
  isEnrolled: boolean;
  enrolledAt?: string;
  role: 'student' | 'admin';
  isOwner?: boolean;
  lastLoginAt: string;
  createdAt: string;
  completedLessonIds: string[];
}

export interface PaymentRecord {
  id: string;
  orderId: string;
  paymentId?: string;
  amount: number; // ₹499
  currency: string; // 'INR'
  status: 'created' | 'paid' | 'failed';
  method: 'razorpay_upi' | 'razorpay_card' | 'razorpay_netbanking' | 'manual_admin' | 'gateway_test';
  studentPhone: string;
  studentName?: string;
  timestamp: string;
  receiptNumber: string;
  signature?: string;
  notes?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  adminPhone: string;
  targetId?: string;
  targetType?: 'student' | 'lesson' | 'course' | 'payment';
  details: string;
  timestamp: string;
}

export interface SupportTicket {
  id: string;
  studentPhone: string;
  studentName?: string;
  subject: string;
  message: string;
  status: 'open' | 'resolved';
  createdAt: string;
}
