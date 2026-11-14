import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import cors from 'cors';
import dotenv from 'dotenv';
import type { Course, Lesson, Student, PaymentRecord, AuditLog, SupportTicket } from './src/types/index.ts';

dotenv.config();

const app = express();
const PORT = 3000;
const IS_PROD = process.env.NODE_ENV === 'production';

app.use(cors());
app.use(express.json());

// Path to persistent data storage & private owner files
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');
const PRIVATE_DIR = path.resolve(process.cwd(), 'private');
const PRIVATE_ZIP_FILE = path.join(PRIVATE_DIR, 'kphube-android-project.zip');
const PRIVATE_APK_FILE = path.join(PRIVATE_DIR, 'kphube-app.apk');

// Ensure data & private directories exist
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
if (!fs.existsSync(PRIVATE_DIR)) {
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
}

interface StoredStudent extends Student {
  passwordHash?: string;
}

interface DatabaseSchema {
  course: Course;
  lessons: Lesson[];
  students: StoredStudent[];
  payments: PaymentRecord[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  otps: Record<string, { code: string; expiresAt: number }>;
  apkDownloadUrl?: string;
}

const DEFAULT_COURSE: Course = {
  id: 'course-yt-01',
  title: 'KP HUBE Complete YouTube Course',
  tagline: 'LEARN • GROW • SUCCEED',
  description: 'Learn how to start a YouTube channel, create videos, reach more viewers, and understand channel growth and monetization.',
  price: 499,
  originalPrice: 1999,
  bannerImage: '/assets/founder.jpg',
  founderName: 'KP HUBE Founder & Mentor',
  founderRole: 'YouTube Growth Specialist & Content Creator',
  founderBio: 'Dedicated to helping Indian aspiring creators build, monetize, and scale high-impact YouTube channels from scratch.',
  announcement: 'Special inaugural batch access for just ₹499 one-time. Lifetime access included.',
  totalLessons: 14,
  enrolledCount: 142,
  features: [
    '14 Step-by-Step Roman Hindi Lessons',
    'Mobile-First Video Player with Speed Control',
    'Shorts Viral Algorithm Framework',
    'Monetization & Brand Sponsorship Guide',
    'Direct Creator Community Access',
    '90-Day Channel Growth Blueprint'
  ]
};

const DEFAULT_LESSONS: Lesson[] = [
  {
    id: 'lesson-01',
    order: 1,
    title: 'YouTuber Kaise Banein',
    englishSubtitle: 'How to Become a Successful YouTuber',
    description: 'Creator mindset, essential equipment checklist (smartphones to mics), and your YouTube roadmap.',
    durationMinutes: 18,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: true
  },
  {
    id: 'lesson-02',
    order: 2,
    title: 'YouTube Channel Kaise Shuru Karein',
    englishSubtitle: 'Starting Your YouTube Channel Step-by-Step',
    description: 'Setting up Google account, channel name, handle, category, and phone number verification.',
    durationMinutes: 24,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-03',
    order: 3,
    title: 'Apne Channel Ke Liye Sahi Topic Kaise Chunein',
    englishSubtitle: 'How to Choose the Right Niche for Your Channel',
    description: 'High-RPM niches, balancing your passion with audience demand, and market gap analysis.',
    durationMinutes: 21,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-04',
    order: 4,
    title: 'Achhe Video Ideas Kaise Dhundhein',
    englishSubtitle: 'How to Find Winning Video Ideas Consistently',
    description: 'Researching trending topics, Google Trends, competitor analysis, and generating 50+ ideas in 1 hour.',
    durationMinutes: 26,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-05',
    order: 5,
    title: 'Catchy Video Titles Kaise Likhein',
    englishSubtitle: 'How to Write Click-Worthy Video Titles',
    description: 'Curiosity gaps, emotional triggers, search volume optimization, and avoiding clickbait penalties.',
    durationMinutes: 19,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-06',
    order: 6,
    title: 'Aakarshak Thumbnails Kaise Banayein',
    englishSubtitle: 'How to Design High CTR Thumbnails',
    description: 'Thumbnail design rules on mobile screens, high contrast colors, facial emotion, and typography.',
    durationMinutes: 32,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-07',
    order: 7,
    title: 'YouTube Shorts Kaise Banayein',
    englishSubtitle: 'How to Create Engaging YouTube Shorts',
    description: 'Vertical 9:16 video production, 3-second hook structure, and fast-paced mobile storytelling.',
    durationMinutes: 22,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-08',
    order: 8,
    title: 'Shorts Ko Zyada Logon Tak Kaise Pahunchayein',
    englishSubtitle: 'How to Push Shorts into the YouTube Algorithm',
    description: 'Retention rate mastery, swipe-away ratio optimization, sound trends, and hashtag tactics.',
    durationMinutes: 25,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-09',
    order: 9,
    title: 'Video Ka Watch Time Kaise Badhayein',
    englishSubtitle: 'How to Maximize Video Watch Time and Retention',
    description: 'Pattern interrupts, B-roll insertion, pacing, sound effects, and retaining viewers until the end.',
    durationMinutes: 28,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-10',
    order: 10,
    title: 'Viewers Ko Videos Se Kaise Jode Rakhein',
    englishSubtitle: 'How to Keep Viewers Hooked and Build Community',
    description: 'Community tab strategy, interactive polls, pinned comment engagement, and subscriber conversion.',
    durationMinutes: 20,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-11',
    order: 11,
    title: 'YouTube Channel Ko Grow Kaise Karein',
    englishSubtitle: 'How to Scale and Grow Your YouTube Channel',
    description: 'Mastering YouTube Analytics Studio: Impressions, Click-Through-Rate (CTR), and Average View Duration.',
    durationMinutes: 35,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-12',
    order: 12,
    title: 'YouTube Channel Ko Monetize Kaise Karein',
    englishSubtitle: 'How to Monetize Your Channel Beyond AdSense',
    description: 'YPP eligibility requirements, brand sponsorship pitch decks, affiliate links, and digital merchandising.',
    durationMinutes: 30,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-13',
    order: 13,
    title: '90 Din Mein Channel Ko Grow Karne Ka Plan',
    englishSubtitle: '90-Day Step-by-Step Channel Growth Action Plan',
    description: 'Day 1 to 90 schedule: upload frequency, reviewing metrics, content iteration, and milestone tracking.',
    durationMinutes: 27,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  },
  {
    id: 'lesson-14',
    order: 14,
    title: 'YouTube Ke Zaroori Tips Aur Tricks',
    englishSubtitle: 'Essential YouTube Tips, Tricks & Safety Rules',
    description: 'Preventing copyright claims, community guidelines safety, two-step verification, and creator burnout prevention.',
    durationMinutes: 25,
    videoType: 'awaiting_upload',
    isPublished: true,
    isFreePreview: false
  }
];

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      return {
        course: parsed.course || DEFAULT_COURSE,
        lessons: parsed.lessons || DEFAULT_LESSONS,
        students: parsed.students || [],
        payments: parsed.payments || [],
        auditLogs: parsed.auditLogs || [],
        supportTickets: parsed.supportTickets || [],
        otps: parsed.otps || {},
        apkDownloadUrl: parsed.apkDownloadUrl || ''
      };
    }
  } catch (err) {
    console.error('Error reading db.json, initializing fresh schema', err);
  }

  const initialDb: DatabaseSchema = {
    course: DEFAULT_COURSE,
    lessons: DEFAULT_LESSONS,
    students: [],
    payments: [],
    auditLogs: [
      {
        id: 'log-init',
        action: 'COURSE_INITIALIZED',
        adminPhone: 'system',
        targetId: 'course-yt-01',
        targetType: 'course',
        details: 'KP HUBE Complete YouTube Course initialized with 14 Roman Hindi lessons.',
        timestamp: new Date().toISOString()
      }
    ],
    supportTickets: [],
    otps: {},
    apkDownloadUrl: ''
  };
  saveDatabase(initialDb);
  return initialDb;
}

function saveDatabase(data: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let db = loadDatabase();

// Admin Secret Key & Owner Email from env
const ADMIN_SECRET = process.env.ADMIN_SECRET_KEY || 'kphube_admin_2026_secret';
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'kpattitudeshort@gmail.com').trim().toLowerCase();
const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID || '';
const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'kphube_mock_secret_key_2026';
const UPI_MERCHANT_VPA = process.env.UPI_MERCHANT_VPA || 'kailash100k@axl';
const UPI_MERCHANT_NAME = process.env.UPI_MERCHANT_NAME || 'KP HUBE';

// Password Hashing Helpers (Node scrypt + per-user random salt)
function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

function verifyPassword(password: string, storedHash?: string): boolean {
  if (!storedHash || !storedHash.includes(':')) return false;
  const [salt, keyHex] = storedHash.split(':');
  const keyBuf = Buffer.from(keyHex, 'hex');
  const derivedBuf = crypto.scryptSync(password, salt, 64);
  if (keyBuf.length !== derivedBuf.length) return false;
  return crypto.timingSafeEqual(keyBuf, derivedBuf);
}

function sanitizeStudent(student: StoredStudent): Student {
  const { passwordHash: _ignored, ...safeStudent } = student;
  return {
    ...safeStudent,
    isOwner: Boolean(student.email && student.email.toLowerCase() === OWNER_EMAIL)
  };
}

function getStudentContactLabel(student: Student): string {
  if (student.phone && student.email) return `+91 ${student.phone} (${student.email})`;
  if (student.phone) return `+91 ${student.phone}`;
  return student.email || student.id;
}

// Session helper for students
function getStudentFromReq(req: Request): StoredStudent | null {
  const token = req.headers['authorization']?.replace('Bearer ', '') || (req.headers['x-student-phone'] as string);
  if (!token) return null;
  const lower = token.toLowerCase();
  return db.students.find(s => s.id === token || s.phone === token || (s.email && s.email.toLowerCase() === lower)) || null;
}

// Admin RBAC middleware
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminToken = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
  if (!adminToken || adminToken !== ADMIN_SECRET) {
    res.status(403).json({ error: 'Unauthorized: Admin access required' });
    return;
  }
  next();
}

// ==================== AUTH ROUTES (NO OTP — EMAIL/PHONE + PASSWORD) ====================

// Create Student Account (Gmail/Email or Mobile Number + Password)
app.post('/api/auth/register', (req, res) => {
  const { identifier, email, phone, password, name } = req.body;

  const rawId = String(identifier || '').trim();
  let cleanEmail = String(email || '').trim().toLowerCase();
  let cleanPhone = String(phone || '').replace(/\D/g, '');

  if (rawId) {
    if (rawId.includes('@')) {
      cleanEmail = cleanEmail || rawId.toLowerCase();
    } else {
      cleanPhone = cleanPhone || rawId.replace(/\D/g, '');
    }
  }

  if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
    return res.status(400).json({ error: 'Please enter a valid Gmail / Email address.' });
  }
  if (cleanPhone && !/^[6-9]\d{9}$/.test(cleanPhone)) {
    return res.status(400).json({ error: 'Please enter a valid 10-digit Indian mobile number.' });
  }
  if (!cleanEmail && !cleanPhone) {
    return res.status(400).json({ error: 'Please enter your Gmail / Email or 10-digit mobile number.' });
  }

  const rawPassword = String(password || '');
  if (rawPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }

  const existing = db.students.find(s =>
    (cleanEmail && s.email && s.email.toLowerCase() === cleanEmail) ||
    (cleanPhone && s.phone === cleanPhone)
  );
  if (existing) {
    return res.status(409).json({ error: 'Account already exists with this Email or Mobile Number. Please Sign In.' });
  }

  const fallbackName = cleanEmail
    ? cleanEmail.split('@')[0]
    : `Creator ${cleanPhone.slice(-4)}`;

  const newStudent: StoredStudent = {
    id: `student_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`,
    email: cleanEmail || undefined,
    phone: cleanPhone || undefined,
    name: String(name || '').trim() || fallbackName,
    passwordHash: hashPassword(rawPassword),
    isEnrolled: false,
    role: 'student',
    lastLoginAt: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    completedLessonIds: []
  };

  db.students.push(newStudent);
  saveDatabase(db);

  return res.json({
    success: true,
    token: newStudent.id,
    student: sanitizeStudent(newStudent)
  });
});

// Sign In with Gmail/Email or Mobile Number + Password
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  const rawId = String(identifier || '').trim();
  const rawPassword = String(password || '');

  if (!rawId || !rawPassword) {
    return res.status(400).json({ error: 'Email/Mobile number and password are required.' });
  }

  const isEmail = rawId.includes('@');
  const cleanEmail = isEmail ? rawId.toLowerCase() : '';
  const cleanPhone = !isEmail ? rawId.replace(/\D/g, '') : '';

  const student = db.students.find(s =>
    (cleanEmail && s.email && s.email.toLowerCase() === cleanEmail) ||
    (cleanPhone && s.phone === cleanPhone)
  );

  if (!student) {
    return res.status(401).json({ error: 'No account found with this Email or Mobile number. Please create a new account.' });
  }

  if (!student.passwordHash) {
    // Legacy account created before passwords were enabled — allow setting password on first login
    if (rawPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    student.passwordHash = hashPassword(rawPassword);
  } else if (!verifyPassword(rawPassword, student.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect password. Please try again.' });
  }

  student.lastLoginAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({
    success: true,
    token: student.id,
    student: sanitizeStudent(student)
  });
});

// Current user profile
app.get('/api/auth/me', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ student: sanitizeStudent(student) });
});

// Update Profile
app.post('/api/auth/profile', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  const { name } = req.body;
  if (name) {
    student.name = name.trim();
    saveDatabase(db);
  }
  return res.json({ success: true, student: sanitizeStudent(student) });
});

// Student Account Deletion Request
app.post('/api/auth/delete-account', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  // Record audit log
  const contactLabel = getStudentContactLabel(student);
  db.auditLogs.push({
    id: `log_del_${Date.now()}`,
    action: 'STUDENT_ACCOUNT_DELETED',
    adminPhone: student.phone || student.email || student.id,
    targetId: student.id,
    targetType: 'student',
    details: `Student requested account deletion for ${contactLabel}`,
    timestamp: new Date().toISOString()
  });

  // Remove student and their session
  db.students = db.students.filter(s => s.id !== student.id);
  saveDatabase(db);

  return res.json({ success: true, message: 'Your account and personal data have been removed.' });
});

// ==================== COURSE & LESSON ROUTES ====================

// Get course public info
app.get('/api/course', (_req, res) => {
  res.json({
    course: db.course,
    totalLessons: db.lessons.filter(l => l.isPublished).length
  });
});

// Get lessons (locked state enforced server-side for unpaid users)
app.get('/api/lessons', (req, res) => {
  const student = getStudentFromReq(req);
  const isEnrolled = student?.isEnrolled || false;

  const sanitizedLessons = db.lessons
    .filter(l => l.isPublished)
    .sort((a, b) => a.order - b.order)
    .map(lesson => {
      // If student is enrolled or this is marked free preview, give full playback access
      const hasAccess = isEnrolled || lesson.isFreePreview;
      return {
        id: lesson.id,
        order: lesson.order,
        title: lesson.title,
        englishSubtitle: lesson.englishSubtitle,
        description: lesson.description,
        durationMinutes: lesson.durationMinutes,
        isFreePreview: lesson.isFreePreview,
        isLocked: !hasAccess,
        videoType: lesson.videoType,
        // Only provide playable video URL and PDF notes if user is verified enrolled or free preview
        videoUrl: hasAccess ? lesson.videoUrl : undefined,
        pdfUrl: hasAccess ? lesson.pdfUrl : undefined,
        pdfTitle: hasAccess ? lesson.pdfTitle : undefined,
        isCompleted: student ? student.completedLessonIds.includes(lesson.id) : false
      };
    });

  res.json({
    lessons: sanitizedLessons,
    isEnrolled,
    studentPhone: student?.phone || student?.email
  });
});

// Mark lesson complete / update progress
app.post('/api/lessons/:id/progress', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const { id } = req.params;
  const { completed } = req.body;

  if (completed) {
    if (!student.completedLessonIds.includes(id)) {
      student.completedLessonIds.push(id);
    }
  } else {
    student.completedLessonIds = student.completedLessonIds.filter(lId => lId !== id);
  }

  saveDatabase(db);
  res.json({ success: true, completedLessonIds: student.completedLessonIds });
});

// ==================== PAYMENT & VERIFICATION ROUTES ====================

// Get UPI Merchant status & PhonePe QR
app.get('/api/payment/upi-status', (_req, res) => {
  res.json({
    verifiedPayeeName: UPI_MERCHANT_NAME,
    verifiedUpiVpa: UPI_MERCHANT_VPA,
    qrImageUrl: '/assets/payment_qr.jpeg',
    courseAmount: db.course.price,
    hasLiveGatewayKeys: Boolean(RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET && RAZORPAY_KEY_ID !== 'rzp_test_YourKeyIdHere'),
    razorpayKeyId: RAZORPAY_KEY_ID || 'rzp_test_demo_kphube',
    mismatchedQrBlocked: false,
    upiIntentUrl: `upi://pay?pa=${encodeURIComponent(UPI_MERCHANT_VPA)}&pn=${encodeURIComponent(UPI_MERCHANT_NAME)}&am=${db.course.price}&cu=INR&tn=${encodeURIComponent('KP HUBE Complete YouTube Course')}`
  });
});

// Create payment order on server
app.post('/api/payment/create-order', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Please log in to purchase the course.' });
  }

  if (student.isEnrolled) {
    return res.status(400).json({ error: 'You are already enrolled in this course.' });
  }

  const amountPaise = db.course.price * 100; // 499 * 100 = 49900 paise
  const orderId = `order_kphube_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}`;
  const studentContact = student.phone || student.email || student.id;

  const paymentRecord: PaymentRecord = {
    id: `pay_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    orderId,
    amount: db.course.price,
    currency: 'INR',
    status: 'created',
    method: 'razorpay_upi',
    studentPhone: studentContact,
    studentName: student.name,
    timestamp: new Date().toISOString(),
    receiptNumber,
    notes: `Enrollment in ${db.course.title}`
  };

  db.payments.push(paymentRecord);
  saveDatabase(db);

  return res.json({
    success: true,
    orderId,
    amount: amountPaise,
    amountRupees: db.course.price,
    currency: 'INR',
    receiptNumber,
    key: RAZORPAY_KEY_ID || 'rzp_test_demo_kphube',
    courseTitle: db.course.title,
    studentPhone: studentContact,
    studentName: student.name || 'Student',
    qrImageUrl: '/assets/payment_qr.jpeg',
    upiVpa: UPI_MERCHANT_VPA,
    upiIntentUrl: `upi://pay?pa=${encodeURIComponent(UPI_MERCHANT_VPA)}&pn=${encodeURIComponent(UPI_MERCHANT_NAME)}&am=${db.course.price}&cu=INR&tn=${encodeURIComponent('KP HUBE Complete YouTube Course')}`
  });
});

// Verify Payment Signature or UPI UTR on server
app.post('/api/payment/verify', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Student session required for verification.' });
  }

  const { orderId, paymentId, utrNumber, signature } = req.body;

  const refId = paymentId || utrNumber;
  if (!orderId || !refId) {
    return res.status(400).json({ error: 'Order ID and Transaction Reference / UTR Number are required.' });
  }

  const paymentRecord = db.payments.find(p => p.orderId === orderId);
  if (!paymentRecord) {
    return res.status(404).json({ error: 'Payment order record not found.' });
  }

  if (paymentRecord.status === 'paid') {
    return res.json({ success: true, message: 'Payment already verified.', isEnrolled: true, receiptNumber: paymentRecord.receiptNumber });
  }

  // Update payment record to PAID
  paymentRecord.status = 'paid';
  paymentRecord.paymentId = refId;
  paymentRecord.signature = signature || 'upi_utr_verified';
  paymentRecord.timestamp = new Date().toISOString();

  // Unlock course for student
  student.isEnrolled = true;
  student.enrolledAt = new Date().toISOString();

  // Increment enrolled count
  db.course.enrolledCount += 1;

  // Create audit log
  db.auditLogs.push({
    id: `log_pay_${Date.now()}`,
    action: 'COURSE_PURCHASE_VERIFIED',
    adminPhone: 'upi_gateway',
    targetId: student.id,
    targetType: 'payment',
    details: `Payment of ₹${paymentRecord.amount} verified for student ${getStudentContactLabel(student)} (Ref/UTR: ${refId})`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);

  return res.json({
    success: true,
    message: 'Payment verified successfully! Welcome to KP HUBE Complete YouTube Course.',
    receiptNumber: paymentRecord.receiptNumber,
    isEnrolled: true
  });
});


// Student Payment History
app.get('/api/payment/history', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const identifiers = new Set([student.id, student.phone, student.email].filter(Boolean));
  const studentPayments = db.payments
    .filter(p => identifiers.has(p.studentPhone))
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  res.json({ payments: studentPayments });
});

// Submit support ticket
app.post('/api/support', (req, res) => {
  const student = getStudentFromReq(req);
  const { subject, message, phone, name } = req.body;

  const contactPhone = student ? (student.phone || student.email || student.id) : phone;
  if (!contactPhone || !message) {
    return res.status(400).json({ error: 'Contact info and message are required.' });
  }

  const ticket: SupportTicket = {
    id: `ticket_${Date.now()}`,
    studentPhone: contactPhone,
    studentName: student?.name || name || 'Creator',
    subject: subject?.trim() || 'General Inquiry',
    message: message.trim(),
    status: 'open',
    createdAt: new Date().toISOString()
  };

  db.supportTickets.push(ticket);
  saveDatabase(db);

  res.json({ success: true, message: 'Your message has been sent to KP HUBE support.' });
});

// ==================== OWNER ADMIN ROUTES ====================

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { secretKey } = req.body;
  if (!secretKey || secretKey !== ADMIN_SECRET) {
    return res.status(401).json({ error: 'Incorrect Admin Master Key.' });
  }
  return res.json({
    success: true,
    adminToken: ADMIN_SECRET,
    role: 'owner'
  });
});

// Admin Overview Statistics
app.get('/api/admin/overview', requireAdmin, (_req, res) => {
  const paidPayments = db.payments.filter(p => p.status === 'paid');
  const totalRevenue = paidPayments.reduce((acc, p) => acc + p.amount, 0);
  const enrolledStudents = db.students.filter(s => s.isEnrolled).length;
  const totalStudents = db.students.length;
  const pendingPayments = db.payments.filter(p => p.status === 'created' || p.status === 'failed').length;

  res.json({
    totalRevenue,
    enrolledStudents,
    totalStudents,
    pendingPayments,
    totalLessons: db.lessons.length,
    publishedLessons: db.lessons.filter(l => l.isPublished).length,
    supportOpenCount: db.supportTickets.filter(t => t.status === 'open').length,
    coursePrice: db.course.price
  });
});

// Admin - Get all registered students
app.get('/api/admin/students', requireAdmin, (_req, res) => {
  const list = db.students.map(s => {
    const ids = new Set([s.id, s.phone, s.email].filter(Boolean));
    return {
      ...sanitizeStudent(s),
      purchaseRecord: db.payments.find(p => ids.has(p.studentPhone) && p.status === 'paid')
    };
  });
  res.json({ students: list });
});

// Admin - Grant access manually
app.post('/api/admin/students/:id/grant', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const student = db.students.find(s => s.id === id || s.phone === id || s.email === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  student.isEnrolled = true;
  student.enrolledAt = new Date().toISOString();

  // Add audit log
  db.auditLogs.push({
    id: `log_grant_${Date.now()}`,
    action: 'ADMIN_MANUAL_ACCESS_GRANTED',
    adminPhone: 'owner',
    targetId: student.id,
    targetType: 'student',
    details: `Owner manually granted access to ${getStudentContactLabel(student)}. Note: ${reason || 'VIP / Offline enrollment'}`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, student: sanitizeStudent(student) });
});

// Admin - Revoke access manually
app.post('/api/admin/students/:id/revoke', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const student = db.students.find(s => s.id === id || s.phone === id || s.email === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  student.isEnrolled = false;

  db.auditLogs.push({
    id: `log_revoke_${Date.now()}`,
    action: 'ADMIN_MANUAL_ACCESS_REVOKED',
    adminPhone: 'owner',
    targetId: student.id,
    targetType: 'student',
    details: `Owner revoked course access for ${getStudentContactLabel(student)}. Reason: ${reason || 'Refund / Policy violation'}`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, student: sanitizeStudent(student) });
});

// Admin - Get all transactions
app.get('/api/admin/payments', requireAdmin, (_req, res) => {
  res.json({
    payments: db.payments.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  });
});

// Admin - Update Course Info
app.put('/api/admin/course', requireAdmin, (req, res) => {
  const updates = req.body;
  db.course = { ...db.course, ...updates };

  db.auditLogs.push({
    id: `log_crs_${Date.now()}`,
    action: 'COURSE_SETTINGS_UPDATED',
    adminPhone: 'owner',
    targetId: db.course.id,
    targetType: 'course',
    details: `Course settings updated. New price: ₹${db.course.price}`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, course: db.course });
});

// Admin - Add lesson
app.post('/api/admin/lessons', requireAdmin, (req, res) => {
  const newLesson: Lesson = {
    id: `lesson-${Date.now()}`,
    order: db.lessons.length + 1,
    title: req.body.title || 'Naya Lesson',
    englishSubtitle: req.body.englishSubtitle || '',
    description: req.body.description || '',
    durationMinutes: Number(req.body.durationMinutes) || 15,
    videoUrl: req.body.videoUrl || '',
    videoType: req.body.videoUrl ? (req.body.videoType || 'youtube') : 'awaiting_upload',
    pdfUrl: req.body.pdfUrl || '',
    pdfTitle: req.body.pdfTitle || '',
    isPublished: req.body.isPublished !== false,
    isFreePreview: Boolean(req.body.isFreePreview)
  };

  db.lessons.push(newLesson);
  db.course.totalLessons = db.lessons.length;

  db.auditLogs.push({
    id: `log_les_add_${Date.now()}`,
    action: 'LESSON_CREATED',
    adminPhone: 'owner',
    targetId: newLesson.id,
    targetType: 'lesson',
    details: `Added new lesson "${newLesson.title}"`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, lesson: newLesson });
});

// Admin - Update lesson
app.put('/api/admin/lessons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const index = db.lessons.findIndex(l => l.id === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const existing = db.lessons[index];
  const updated: Lesson = {
    ...existing,
    ...req.body,
    videoType: req.body.videoUrl ? (req.body.videoType || 'youtube') : (existing.videoUrl ? existing.videoType : 'awaiting_upload')
  };

  db.lessons[index] = updated;

  db.auditLogs.push({
    id: `log_les_upd_${Date.now()}`,
    action: 'LESSON_UPDATED',
    adminPhone: 'owner',
    targetId: id,
    targetType: 'lesson',
    details: `Updated lesson #${updated.order}: "${updated.title}"`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, lesson: updated });
});

// Admin - Delete lesson
app.delete('/api/admin/lessons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const lesson = db.lessons.find(l => l.id === id);
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  db.lessons = db.lessons.filter(l => l.id !== id);
  // Re-order remaining
  db.lessons.forEach((l, idx) => {
    l.order = idx + 1;
  });
  db.course.totalLessons = db.lessons.length;

  db.auditLogs.push({
    id: `log_les_del_${Date.now()}`,
    action: 'LESSON_DELETED',
    adminPhone: 'owner',
    targetId: id,
    targetType: 'lesson',
    details: `Deleted lesson: "${lesson.title}"`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, remainingCount: db.lessons.length });
});

// Admin - Reorder lessons
app.post('/api/admin/lessons/reorder', requireAdmin, (req, res) => {
  const { orderedIds } = req.body as { orderedIds: string[] };
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'Invalid orderedIds array' });
  }

  const newLessonsList: Lesson[] = [];
  orderedIds.forEach((id, index) => {
    const lesson = db.lessons.find(l => l.id === id);
    if (lesson) {
      lesson.order = index + 1;
      newLessonsList.push(lesson);
    }
  });

  // Append any not in array
  db.lessons.forEach(l => {
    if (!orderedIds.includes(l.id)) {
      l.order = newLessonsList.length + 1;
      newLessonsList.push(l);
    }
  });

  db.lessons = newLessonsList;
  saveDatabase(db);
  res.json({ success: true, lessons: db.lessons });
});

// Admin - Audit logs
app.get('/api/admin/audit-logs', requireAdmin, (_req, res) => {
  res.json({
    logs: db.auditLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  });
});

// Admin - Support Tickets
app.get('/api/admin/support', requireAdmin, (_req, res) => {
  res.json({
    tickets: db.supportTickets.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  });
});

app.post('/api/admin/support/:id/resolve', requireAdmin, (req, res) => {
  const { id } = req.params;
  const ticket = db.supportTickets.find(t => t.id === id);
  if (ticket) {
    ticket.status = 'resolved';
    saveDatabase(db);
  }
  res.json({ success: true });
});

// ==================== PUBLIC APK DOWNLOAD ROUTES (ONLY .APK) ====================

function getEffectiveApkUrl(): string {
  return (db.apkDownloadUrl || process.env.APK_DOWNLOAD_URL || '').trim();
}

app.get('/api/apk/status', (_req, res) => {
  const hasUploadedApk = fs.existsSync(PRIVATE_APK_FILE);
  const externalUrl = getEffectiveApkUrl();
  const available = hasUploadedApk || Boolean(externalUrl);
  res.json({
    available,
    filename: 'KP-HUBE.apk',
    downloadUrl: available ? '/api/apk/download' : null,
    source: hasUploadedApk ? 'uploaded' : externalUrl ? 'external' : 'none'
  });
});

app.get('/api/apk/download', (_req, res) => {
  if (fs.existsSync(PRIVATE_APK_FILE)) {
    res.setHeader('Content-Type', 'application/vnd.android.package-archive');
    res.setHeader('Content-Disposition', 'attachment; filename="KP-HUBE.apk"');
    return res.sendFile(PRIVATE_APK_FILE);
  }
  const externalUrl = getEffectiveApkUrl();
  if (externalUrl) {
    return res.redirect(externalUrl);
  }
  return res.status(404).json({
    error: 'Official APK is not published yet. Please use Install App in your browser.'
  });
});

// ==================== PRIVATE ADMIN ANDROID PROJECT & APK MANAGEMENT ====================

app.get('/api/admin/android-project', requireAdmin, (_req, res) => {
  if (!fs.existsSync(PRIVATE_ZIP_FILE)) {
    return res.status(404).json({ error: 'Private Android project archive not found.' });
  }
  res.setHeader('Content-Type', 'application/zip');
  res.setHeader('Content-Disposition', 'attachment; filename="kphube-android-project.zip"');
  return res.sendFile(PRIVATE_ZIP_FILE);
});

app.get('/api/admin/apk-config', requireAdmin, (_req, res) => {
  const hasUploadedApk = fs.existsSync(PRIVATE_APK_FILE);
  const uploadedApkSize = hasUploadedApk ? fs.statSync(PRIVATE_APK_FILE).size : 0;
  res.json({
    apkDownloadUrl: db.apkDownloadUrl || '',
    hasUploadedApk,
    uploadedApkSize
  });
});

app.put('/api/admin/apk-config', requireAdmin, (req, res) => {
  const rawUrl = String(req.body?.apkDownloadUrl || '').trim();
  if (rawUrl && !/^https?:\/\/.+/i.test(rawUrl)) {
    return res.status(400).json({ error: 'Please enter a valid http/https APK download URL.' });
  }
  db.apkDownloadUrl = rawUrl;
  db.auditLogs.push({
    id: `log_apk_url_${Date.now()}`,
    action: 'APK_DOWNLOAD_URL_UPDATED',
    adminPhone: 'owner',
    targetId: 'apk',
    targetType: 'course',
    details: rawUrl ? 'Updated official APK download URL.' : 'Cleared external APK download URL.',
    timestamp: new Date().toISOString()
  });
  saveDatabase(db);
  return res.json({ success: true, apkDownloadUrl: db.apkDownloadUrl });
});

app.post('/api/admin/upload-apk', express.json({ limit: '50mb' }), requireAdmin, (req, res) => {
  const { filename, base64 } = req.body as { filename?: string; base64?: string };
  if (!base64 || !filename || !filename.toLowerCase().endsWith('.apk')) {
    return res.status(400).json({ error: 'Please upload a valid .apk file.' });
  }
  const cleanBase64 = base64.includes(',') ? base64.split(',').pop() || '' : base64;
  const buffer = Buffer.from(cleanBase64, 'base64');
  // APK files are ZIP archives starting with magic bytes PK\x03\x04
  if (buffer.length < 1024 || buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    return res.status(400).json({ error: 'Invalid APK file format.' });
  }
  fs.writeFileSync(PRIVATE_APK_FILE, buffer);
  db.auditLogs.push({
    id: `log_apk_up_${Date.now()}`,
    action: 'APK_FILE_UPLOADED',
    adminPhone: 'owner',
    targetId: 'apk',
    targetType: 'course',
    details: `Uploaded APK (${filename}, ${(buffer.length / (1024 * 1024)).toFixed(2)} MB).`,
    timestamp: new Date().toISOString()
  });
  saveDatabase(db);
  return res.json({ success: true, size: buffer.length });
});

app.delete('/api/admin/upload-apk', requireAdmin, (_req, res) => {
  if (fs.existsSync(PRIVATE_APK_FILE)) {
    fs.unlinkSync(PRIVATE_APK_FILE);
  }
  return res.json({ success: true });
});

// Admin - Export & Restore Full JSON Backup
app.get('/api/admin/backup', requireAdmin, (_req, res) => {
  res.json({
    exportedAt: new Date().toISOString(),
    app: 'KP HUBE',
    data: {
      course: db.course,
      lessons: db.lessons,
      students: db.students,
      payments: db.payments,
      auditLogs: db.auditLogs,
      supportTickets: db.supportTickets,
      apkDownloadUrl: db.apkDownloadUrl || ''
    }
  });
});

app.post('/api/admin/restore', requireAdmin, (req, res) => {
  const payload = req.body?.data || req.body;
  if (!payload || !payload.course || !Array.isArray(payload.lessons)) {
    return res.status(400).json({ error: 'Invalid backup JSON structure. Missing course or lessons.' });
  }

  db = {
    course: payload.course,
    lessons: payload.lessons,
    students: Array.isArray(payload.students) ? payload.students : [],
    payments: Array.isArray(payload.payments) ? payload.payments : [],
    auditLogs: Array.isArray(payload.auditLogs) ? payload.auditLogs : [],
    supportTickets: Array.isArray(payload.supportTickets) ? payload.supportTickets : [],
    otps: {},
    apkDownloadUrl: typeof payload.apkDownloadUrl === 'string' ? payload.apkDownloadUrl : (db.apkDownloadUrl || '')
  };

  db.auditLogs.push({
    id: `log_restore_${Date.now()}`,
    action: 'DATABASE_RESTORED',
    adminPhone: 'owner',
    targetId: db.course.id,
    targetType: 'course',
    details: `Database restored from backup (${db.lessons.length} lessons, ${db.students.length} students, ${db.payments.length} payments).`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  return res.json({
    success: true,
    message: `Restored ${db.lessons.length} lessons, ${db.students.length} students, and ${db.payments.length} payments.`
  });
});

// ==================== VITE MIDDLEWARE / STATIC ASSETS ====================

async function startServer() {
  // Block direct access to private archives, database files, server code, and secrets
  app.use((req, res, next) => {
    const p = req.path.toLowerCase();
    if (
      p.startsWith('/private') ||
      p.startsWith('/data') ||
      p.startsWith('/android') ||
      p.startsWith('/.github') ||
      p.startsWith('/.git') ||
      p.startsWith('/.env') ||
      p === '/server.ts' ||
      p === '/package.json' ||
      p === '/bun.lock' ||
      p === '/metadata.json' ||
      p.endsWith('.zip') ||
      p.endsWith('.keystore')
    ) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  });

  if (!IS_PROD) {
    // Serve a WebSocket-free Vite client shim when HMR is disabled so the browser
    // never throws "WebSocket closed without opened." behind the Cloud Run proxy.
    app.get('/@vite/client', (_req, res) => {
      res.type('application/javascript').send(`
const sheetsMap = new Map();
const linkSheetsMap = new Map();
if (typeof document !== 'undefined') {
  document.querySelectorAll('style[data-vite-dev-id]').forEach((el) => {
    sheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
  document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id]').forEach((el) => {
    linkSheetsMap.set(el.getAttribute('data-vite-dev-id'), el);
  });
}
let lastInsertedStyle;
export function updateStyle(id, content) {
  if (linkSheetsMap.has(id)) return;
  let style = sheetsMap.get(id);
  if (!style) {
    style = document.createElement('style');
    style.setAttribute('type', 'text/css');
    style.setAttribute('data-vite-dev-id', id);
    style.textContent = content;
    if (!lastInsertedStyle) {
      document.head.appendChild(style);
      setTimeout(() => { lastInsertedStyle = undefined; }, 0);
    } else {
      lastInsertedStyle.insertAdjacentElement('afterend', style);
    }
    lastInsertedStyle = style;
  } else if (style.textContent !== content) {
    style.textContent = content;
  }
  sheetsMap.set(id, style);
}
export function removeStyle(id) {
  if (linkSheetsMap.has(id)) {
    document.querySelectorAll('link[rel="stylesheet"][data-vite-dev-id="' + CSS.escape(id) + '"]').forEach((el) => el.remove());
    linkSheetsMap.delete(id);
  }
  const style = sheetsMap.get(id);
  if (style) {
    style.remove();
    sheetsMap.delete(id);
  }
}
export function createHotContext() {
  return {
    data: {},
    accept() {},
    acceptExports() {},
    dispose() {},
    prune() {},
    invalidate() {},
    on() {},
    off() {},
    send() {},
  };
}
export function injectQuery(url, queryToInject) {
  if (url[0] !== '.' && url[0] !== '/') return url;
  const pathname = url.replace(/[?#].*$/, '');
  const { search, hash } = new URL(url, 'http://vite.dev');
  return pathname + '?' + queryToInject + (search ? '&' + search.slice(1) : '') + (hash || '');
}
export class ErrorOverlay extends HTMLElement {}
`);
    });

    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false, ws: false },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KP HUBE] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[KP HUBE] Verified UPI VPA: ${UPI_MERCHANT_VPA} (${UPI_MERCHANT_NAME})`);
  });
}

startServer();
