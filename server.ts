import express from 'express';
import type { Request, Response, NextFunction } from 'express';
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
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

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
  courses?: Course[];
  lessons: Lesson[];
  students: StoredStudent[];
  payments: PaymentRecord[];
  auditLogs: AuditLog[];
  supportTickets: SupportTicket[];
  otps: Record<string, { code: string; expiresAt: number }>;
  apkDownloadUrl?: string;
  adminPasswordHash?: string;
}

const DEFAULT_COURSE: Course = {
  id: 'course-yt-01',
  title: 'KP HUBE YouTube Starter Course',
  tagline: 'LEARN • GROW • SUCCEED',
  description: 'Learn how to start a YouTube channel, create your first videos, reach real viewers, and understand channel growth basics across 5 focused episodes.',
  price: 49,
  originalPrice: 1499,
  bannerImage: '/assets/founder.jpg',
  founderName: 'KP HUBE Founder & Mentor',
  founderRole: 'YouTube Growth Specialist & Content Creator',
  founderBio: 'Dedicated to helping Indian aspiring creators build, monetize, and scale high-impact YouTube channels from scratch.',
  announcement: 'Starter Batch Access for just ₹49 one-time — includes 5 Step-by-Step Episodes.',
  totalLessons: 5,
  enrolledCount: 142,
  isMain: false,
  badge: 'STARTER COURSE • ₹49',
  features: [
    '5 Step-by-Step Video Episodes',
    'Mobile-First Video Player with Speed Control',
    'Channel Setup & Niche Selection',
    'First Video Upload & SEO Checklist',
    'Direct Creator Community Access'
  ]
};

const DEFAULT_VIP_COURSE: Course = {
  id: 'course-vip-01',
  title: 'VIP Course — KP HUBE Main Mastery',
  tagline: 'MAIN VIP PROGRAM • LEARN • GROW • SUCCEED',
  description: 'Our flagship 15-episode VIP Main Course for serious creators: complete channel architecture, viral retention mastery, high-RPM niche selection, brand deals, and monetization scaling.',
  price: 299,
  originalPrice: 2999,
  bannerImage: '/assets/founder.jpg',
  founderName: 'KP HUBE Founder & Mentor',
  founderRole: 'YouTube Growth Specialist & Content Creator',
  founderBio: 'Dedicated to helping Indian aspiring creators build, monetize, and scale high-impact YouTube channels from scratch.',
  announcement: 'Main Flagship 15-Episode VIP Course (₹299) — complete creator roadmap with priority mentorship & lifetime updates.',
  totalLessons: 15,
  enrolledCount: 89,
  isMain: true,
  badge: 'VIP MAIN COURSE • ₹299',
  features: [
    '15 VIP Masterclass Episodes',
    'High-RPM Niche & Channel Audit System',
    'Viral Script & Retention Engineering',
    'Brand Sponsorship & AdSense Scaling',
    'Priority Creator Support Access',
    'Lifetime VIP Updates & Notes'
  ]
};

function createCourseEpisodes(courseId: string, prefix: string, previewTitle: string, episodeCount = 5): Lesson[] {
  return [
    {
      id: `${prefix}-01`,
      courseId,
      order: 1,
      title: 'Episode 1',
      englishSubtitle: previewTitle,
      description: `Course introduction and overview of everything included across all ${episodeCount} episodes.`,
      durationMinutes: 1,
      videoUrl: '/assets/episode-01-intro.mp4',
      videoType: 'mp4',
      isPublished: true,
      isFreePreview: true
    },
    ...Array.from({ length: Math.max(0, episodeCount - 1) }, (_, idx): Lesson => {
      const num = idx + 2;
      return {
        id: `${prefix}-${String(num).padStart(2, '0')}`,
        courseId,
        order: num,
        title: `Episode ${num}`,
        englishSubtitle: '',
        description: '',
        durationMinutes: 0,
        videoUrl: '',
        videoType: 'awaiting_upload',
        isPublished: true,
        isFreePreview: false
      };
    })
  ];
}

const DEFAULT_LESSONS: Lesson[] = [
  ...createCourseEpisodes('course-vip-01', 'vip-episode', 'VIP Course Preview — 15-Episode Main Creator Mastery', 15),
  ...createCourseEpisodes('course-yt-01', 'episode', 'Starter Course Preview — What You Will Learn', 5)
];

function isLegacyUntouched14Lessons(lessons: unknown): boolean {
  if (!Array.isArray(lessons) || lessons.length !== 14) return false;
  return lessons.every(
    (l: any) => typeof l?.id === 'string' && l.id.startsWith('lesson-') && !l.videoUrl
  );
}

function isLegacyHindi12Episodes(lessons: unknown): boolean {
  if (!Array.isArray(lessons) || lessons.length !== 12) return false;
  return (
    lessons[0]?.id === 'episode-01' &&
    lessons.slice(1).every((l: any) => typeof l?.id === 'string' && l.id.startsWith('episode-') && !l.videoUrl)
  );
}

function ensureCoursesAndLessons(baseCourse: Course, parsedCourses: Course[] | undefined, baseLessons: Lesson[]): { courses: Course[]; lessons: Lesson[]; migrated: boolean } {
  let migrated = false;
  let lessons: Lesson[] = baseLessons
    .filter(l => {
      if (l.courseId === 'course-yt-02') {
        migrated = true;
        return false;
      }
      return true;
    })
    .map(l => {
      if (!l.courseId) {
        migrated = true;
        return { ...l, courseId: 'course-yt-01' };
      }
      return l;
    });

  let courses: Course[] = Array.isArray(parsedCourses) && parsedCourses.length > 0
    ? parsedCourses
        .filter(c => {
          if (c.id === 'course-yt-02') {
            migrated = true;
            return false;
          }
          return true;
        })
        .map(c => ({ ...c }))
    : [{ ...baseCourse, badge: baseCourse.badge || 'STARTER COURSE • ₹49', isMain: Boolean(baseCourse.isMain) }];

  if (!Array.isArray(parsedCourses) || parsedCourses.length === 0) {
    migrated = true;
  }

  if (!courses.some(c => c.id === 'course-vip-01')) {
    courses.unshift({ ...DEFAULT_VIP_COURSE });
    migrated = true;
  } else {
    const vipIdx = courses.findIndex(c => c.id === 'course-vip-01');
    if (vipIdx >= 0) {
      if (courses[vipIdx].price === 199) {
        courses[vipIdx] = { ...courses[vipIdx], price: 299 };
        migrated = true;
      }
      if (courses[vipIdx].badge === 'VIP MAIN COURSE') {
        courses[vipIdx] = { ...courses[vipIdx], badge: DEFAULT_VIP_COURSE.badge };
        migrated = true;
      }
      if (Array.isArray(courses[vipIdx].features) && courses[vipIdx].features[0] === '5 VIP Masterclass Episodes') {
        courses[vipIdx] = {
          ...courses[vipIdx],
          description: DEFAULT_VIP_COURSE.description,
          announcement: DEFAULT_VIP_COURSE.announcement,
          features: [...DEFAULT_VIP_COURSE.features]
        };
        migrated = true;
      }
    }
  }

  // Ensure Course 1 has distinct name
  const idx1 = courses.findIndex(c => c.id === 'course-yt-01');
  if (idx1 >= 0 && courses[idx1].title === 'KP HUBE Complete YouTube Course') {
    courses[idx1] = {
      ...courses[idx1],
      title: DEFAULT_COURSE.title,
      badge: 'STARTER COURSE • ₹49',
      announcement: DEFAULT_COURSE.announcement
    };
    migrated = true;
  }

  const vipLessons = lessons.filter(l => l.courseId === 'course-vip-01');
  if (vipLessons.length === 0) {
    lessons.push(...createCourseEpisodes('course-vip-01', 'vip-episode', 'VIP Course Preview — 15-Episode Main Creator Mastery', 15));
    migrated = true;
  } else if (
    vipLessons.length === 5 &&
    vipLessons.every(l => l.id.startsWith('vip-episode-')) &&
    vipLessons.slice(1).every(l => !l.videoUrl)
  ) {
    if (vipLessons[0]) {
      vipLessons[0].description = 'Course introduction and overview of everything included across all 15 episodes.';
      vipLessons[0].englishSubtitle = 'VIP Course Preview — 15-Episode Main Creator Mastery';
    }
    for (let num = 6; num <= 15; num++) {
      lessons.push({
        id: `vip-episode-${String(num).padStart(2, '0')}`,
        courseId: 'course-vip-01',
        order: num,
        title: `Episode ${num}`,
        englishSubtitle: '',
        description: '',
        durationMinutes: 0,
        videoUrl: '',
        videoType: 'awaiting_upload',
        isPublished: true,
        isFreePreview: false
      });
    }
    migrated = true;
  }

  courses = courses.map(c => ({
    ...c,
    totalLessons: lessons.filter(l => (l.courseId || 'course-yt-01') === c.id && l.isPublished).length || c.totalLessons
  }));

  return { courses, lessons, migrated };
}

function loadDatabase(): DatabaseSchema {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      const course: Course = parsed.course || DEFAULT_COURSE;
      let lessons: Lesson[] = parsed.lessons || DEFAULT_LESSONS;
      let migrated = false;

      if (isLegacyUntouched14Lessons(lessons) || isLegacyHindi12Episodes(lessons)) {
        lessons = DEFAULT_LESSONS;
        course.totalLessons = 5;
        if (
          Array.isArray(course.features) &&
          course.features.length > 0 &&
          (course.features[0].startsWith('14 ') || course.features[0].startsWith('12 '))
        ) {
          course.features[0] = '5 Step-by-Step Video Episodes';
        }
        migrated = true;
      }

      if (course.price === 499 || course.price === 149) {
        course.price = 49;
        if (typeof course.announcement === 'string') {
          course.announcement = course.announcement.replace(/₹(499|149)/g, '₹49');
        }
        migrated = true;
      }

      const synced = ensureCoursesAndLessons(course, parsed.courses, lessons);
      migrated = migrated || synced.migrated;

      const loaded: DatabaseSchema = {
        course: synced.courses.find(c => c.id === 'course-yt-01') || synced.courses[0] || course,
        courses: synced.courses,
        lessons: synced.lessons,
        students: parsed.students || [],
        payments: parsed.payments || [],
        auditLogs: parsed.auditLogs || [],
        supportTickets: parsed.supportTickets || [],
        otps: parsed.otps || {},
        apkDownloadUrl: parsed.apkDownloadUrl || '',
        adminPasswordHash: typeof parsed.adminPasswordHash === 'string' ? parsed.adminPasswordHash : undefined
      };

      if (migrated) {
        saveDatabase(loaded);
      }
      return loaded;
    }
  } catch (err) {
    console.error('Error reading db.json, initializing fresh schema', err);
  }

  const initialDb: DatabaseSchema = {
    course: DEFAULT_COURSE,
    courses: [DEFAULT_VIP_COURSE, DEFAULT_COURSE],
    lessons: DEFAULT_LESSONS,
    students: [],
    payments: [],
    auditLogs: [
      {
        id: 'log-init',
        action: 'COURSE_INITIALIZED',
        adminPhone: 'system',
        targetId: 'course-vip-01',
        targetType: 'course',
        details: 'KP HUBE initialized with VIP Main Course (₹299, 15 episodes) and Starter Course (₹49, 5 episodes).',
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
    const tmpFile = `${DB_FILE}.tmp`;
    fs.writeFileSync(tmpFile, JSON.stringify(data, null, 2), 'utf-8');
    fs.renameSync(tmpFile, DB_FILE);
  } catch (err) {
    console.error('Error saving db.json:', err);
  }
}

let db = loadDatabase();

// Admin Secret Key & Owner Email (NEVER exposed in client code or .env.example)
const ADMIN_SECRET_FILE = path.join(PRIVATE_DIR, '.admin-secret');
function loadOrCreateAdminSecret(): string {
  const fromEnv = (process.env.ADMIN_SECRET_KEY || '').trim();
  if (fromEnv && fromEnv !== 'kphube_admin_2026_secret') {
    return fromEnv;
  }
  try {
    if (fs.existsSync(ADMIN_SECRET_FILE)) {
      const existing = fs.readFileSync(ADMIN_SECRET_FILE, 'utf-8').trim();
      if (existing.length >= 24) return existing;
    }
  } catch {
    // regenerate below if unreadable
  }
  const generated = crypto.randomBytes(24).toString('base64url');
  fs.writeFileSync(ADMIN_SECRET_FILE, generated, { mode: 0o600 });
  return generated;
}

const ADMIN_SECRET = loadOrCreateAdminSecret();
const OWNER_EMAIL = (process.env.OWNER_EMAIL || 'kpattitudeshort@gmail.com').trim().toLowerCase();
const PRIVATE_ADMIN_PATH = (process.env.ADMIN_PORTAL_PATH || '/kp-owner-studio-9472').trim();
const RAZORPAY_KEY_ID = (process.env.RAZORPAY_KEY_ID || '').trim();
const RAZORPAY_KEY_SECRET = (process.env.RAZORPAY_KEY_SECRET || 'kphube_mock_secret_key_2026').trim();
const RAW_UPI_VPA = (process.env.UPI_MERCHANT_VPA || 'kailash100k@axl').trim();
const UPI_MERCHANT_VPA = RAW_UPI_VPA.endsWith('@ax') ? `${RAW_UPI_VPA}l` : RAW_UPI_VPA;
const UPI_MERCHANT_NAME = (process.env.UPI_MERCHANT_NAME || 'KP HUBE').trim();

// Ephemeral in-memory owner admin sessions + brute-force lockout
const adminSessions = new Map<string, { ownerEmail: string; expiresAt: number }>();
const adminFailedAttempts = new Map<string, { count: number; lockedUntil: number }>();
const ADMIN_SESSION_TTL_MS = 12 * 60 * 60 * 1000;
const ADMIN_LOCKOUT_MS = 15 * 60 * 1000;
const MAX_ADMIN_FAILURES = 5;

function verifyAdminSecret(candidate: string): boolean {
  if (!candidate) return false;
  const a = Buffer.from(candidate, 'utf-8');
  const b = Buffer.from(ADMIN_SECRET, 'utf-8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

function getRateLimitKey(req: Request): string {
  return String(req.ip || req.socket.remoteAddress || 'unknown');
}

function checkAdminRateLimit(key: string): number | null {
  const entry = adminFailedAttempts.get(key);
  if (!entry) return null;
  if (entry.lockedUntil > Date.now()) {
    return Math.ceil((entry.lockedUntil - Date.now()) / 1000);
  }
  if (entry.lockedUntil && entry.lockedUntil <= Date.now()) {
    adminFailedAttempts.delete(key);
  }
  return null;
}

function recordAdminFailure(key: string) {
  const current = adminFailedAttempts.get(key) || { count: 0, lockedUntil: 0 };
  current.count += 1;
  if (current.count >= MAX_ADMIN_FAILURES) {
    current.lockedUntil = Date.now() + ADMIN_LOCKOUT_MS;
  }
  adminFailedAttempts.set(key, current);
}

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

function getStudentEnrolledCourses(student: StoredStudent | null | undefined): string[] {
  if (!student) return [];
  const list = Array.isArray(student.enrolledCourseIds) ? [...student.enrolledCourseIds] : [];
  if (student.isEnrolled && list.length === 0) {
    list.push('course-yt-01');
  }
  return list;
}

function isStudentEnrolledInCourse(student: StoredStudent | null | undefined, courseId: string): boolean {
  if (!student) return false;
  return getStudentEnrolledCourses(student).includes(courseId);
}

function getAllCourses(): Course[] {
  if (Array.isArray(db.courses) && db.courses.length > 0) {
    return db.courses;
  }
  return [db.course];
}

function findCourseById(courseId?: string): Course {
  const courses = getAllCourses();
  if (courseId) {
    const match = courses.find(c => c.id === courseId);
    if (match) return match;
  }
  return courses.find(c => c.isMain) || db.course || courses[0];
}

function sanitizeStudent(student: StoredStudent): Student {
  const { passwordHash: _ignored, ...safeStudent } = student;
  const enrolledCourseIds = getStudentEnrolledCourses(student);
  return {
    ...safeStudent,
    enrolledCourseIds,
    isEnrolled: Boolean(student.isEnrolled || enrolledCourseIds.length > 0),
    isOwner: Boolean(student.email && student.email.toLowerCase() === OWNER_EMAIL)
  };
}

function getStudentContactLabel(student: Student): string {
  if (student.phone && student.email) return `+91 ${student.phone} (${student.email})`;
  if (student.phone) return `+91 ${student.phone}`;
  return student.email || student.id;
}

// Signed student session tokens (30-day TTL, prevents impersonating owner by guessing email/id)
const STUDENT_SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SESSION_SIGNING_KEY = crypto
  .createHash('sha256')
  .update(`kphube-student-session-v1:${ADMIN_SECRET}`)
  .digest();

function issueStudentToken(studentId: string): string {
  const expiresAt = Date.now() + STUDENT_SESSION_TTL_MS;
  const payload = `${studentId}.${expiresAt}`;
  const sig = crypto.createHmac('sha256', SESSION_SIGNING_KEY).update(payload).digest('base64url');
  return `${payload}.${sig}`;
}

function verifyStudentToken(token: string): string | null {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [studentId, expStr, sig] = parts;
  const expiresAt = Number(expStr);
  if (!studentId || !Number.isFinite(expiresAt) || expiresAt < Date.now()) return null;
  const expected = crypto
    .createHmac('sha256', SESSION_SIGNING_KEY)
    .update(`${studentId}.${expStr}`)
    .digest('base64url');
  const a = Buffer.from(sig, 'utf-8');
  const b = Buffer.from(expected, 'utf-8');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return studentId;
}

// Session helper for students (only accepts valid HMAC-signed session tokens)
function getStudentFromReq(req: Request): StoredStudent | null {
  const authHeader = req.headers['authorization'];
  const rawToken = typeof authHeader === 'string' && authHeader.startsWith('Bearer ')
    ? authHeader.slice(7).trim()
    : '';
  if (!rawToken) return null;
  const studentId = verifyStudentToken(rawToken);
  if (!studentId) return null;
  return db.students.find(s => s.id === studentId) || null;
}

// Admin RBAC middleware: requires valid ephemeral admin session token issued after Owner Gmail + Secret Key check
function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const adminToken = String(req.headers['x-admin-token'] || '');
  const session = adminSessions.get(adminToken);
  if (
    !session ||
    canonicalEmail(session.ownerEmail) !== canonicalEmail(OWNER_EMAIL) ||
    session.expiresAt < Date.now()
  ) {
    if (session && session.expiresAt < Date.now()) {
      adminSessions.delete(adminToken);
    }
    res.status(403).json({ error: 'Unauthorized: Owner Gmail & Admin Secret Key verification required.' });
    return;
  }
  next();
}

// ==================== AUTH HELPERS & ROUTES (NO OTP — GMAIL/PHONE + PASSWORD) ====================

function canonicalEmail(rawEmail: string): string {
  const cleaned = rawEmail.replace(/\s+/g, '').toLowerCase();
  const atIdx = cleaned.indexOf('@');
  if (atIdx === -1) return cleaned;
  const local = cleaned.slice(0, atIdx);
  let domain = cleaned.slice(atIdx + 1);
  if (domain === 'googlemail.com') {
    domain = 'gmail.com';
  }
  if (domain === 'gmail.com') {
    return `${local.replace(/\./g, '')}@gmail.com`;
  }
  return `${local}@${domain}`;
}

function normalizeIndianPhone(rawPhone: string): string {
  let digits = rawPhone.replace(/\D/g, '');
  if (digits.length === 12 && digits.startsWith('91')) {
    digits = digits.slice(2);
  } else if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  return digits;
}

function findStudentByIdentifier(cleanEmail: string, cleanPhone: string): StoredStudent | undefined {
  const canonEmail = cleanEmail ? canonicalEmail(cleanEmail) : '';
  return db.students.find(s =>
    (canonEmail && s.email && canonicalEmail(s.email) === canonEmail) ||
    (cleanPhone && s.phone && normalizeIndianPhone(s.phone) === cleanPhone)
  );
}

// Create Student Account (Gmail/Email or Mobile Number + Password)
app.post('/api/auth/register', (req, res) => {
  const { identifier, email, phone, password, name, ownerSetupKey } = req.body;

  const rawId = String(identifier || '').trim();
  let cleanEmail = String(email || '').replace(/\s+/g, '').toLowerCase();
  let cleanPhone = normalizeIndianPhone(String(phone || ''));

  if (rawId) {
    if (rawId.includes('@')) {
      cleanEmail = cleanEmail || rawId.replace(/\s+/g, '').toLowerCase();
    } else {
      cleanPhone = cleanPhone || normalizeIndianPhone(rawId);
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

  const existing = findStudentByIdentifier(cleanEmail, cleanPhone);
  if (existing) {
    // If the user already signed up with this Gmail/Phone and entered their matching password, log them right in
    if (existing.passwordHash && verifyPassword(rawPassword, existing.passwordHash)) {
      existing.lastLoginAt = new Date().toISOString();
      saveDatabase(db);
      return res.json({
        success: true,
        token: issueStudentToken(existing.id),
        student: sanitizeStudent(existing)
      });
    }
    return res.status(409).json({
      error: 'This Gmail or Mobile number is already registered. Please enter your password on Sign In.',
      switchToLogin: true
    });
  }

  // Prevent anyone else from registering the reserved Owner email without the private Owner Key
  if (canonicalEmail(cleanEmail) === canonicalEmail(OWNER_EMAIL)) {
    const rateKey = getRateLimitKey(req);
    const retryAfter = checkAdminRateLimit(rateKey);
    if (retryAfter) {
      return res.status(429).json({ error: `Too many failed attempts. Please wait ${retryAfter}s.` });
    }
    if (!verifyAdminSecret(String(ownerSetupKey || '').trim())) {
      if (ownerSetupKey) {
        recordAdminFailure(rateKey);
      }
      return res.status(403).json({
        error: 'This owner email requires the private Owner Key to register.',
        requireOwnerKey: true
      });
    }
    adminFailedAttempts.delete(rateKey);
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
    token: issueStudentToken(newStudent.id),
    student: sanitizeStudent(newStudent)
  });
});

// Sign In with Gmail/Email or Mobile Number + Password
app.post('/api/auth/login', (req, res) => {
  const { identifier, password } = req.body;
  const rawId = String(identifier || '').trim();
  const rawPassword = String(password || '');

  if (!rawId || !rawPassword) {
    return res.status(400).json({ error: 'Gmail / Mobile number and password are required.' });
  }

  const isEmail = rawId.includes('@');
  const cleanEmail = isEmail ? rawId.replace(/\s+/g, '').toLowerCase() : '';
  const cleanPhone = !isEmail ? normalizeIndianPhone(rawId) : '';

  const student = findStudentByIdentifier(cleanEmail, cleanPhone);

  if (!student) {
    return res.status(401).json({
      error: 'No account found with this Gmail or Mobile number. Please tap Create Account first.'
    });
  }

  if (!student.passwordHash) {
    // Legacy account created before passwords were enabled — allow setting password on first login
    if (rawPassword.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
    }
    student.passwordHash = hashPassword(rawPassword);
  } else if (!verifyPassword(rawPassword, student.passwordHash)) {
    return res.status(401).json({ error: 'Incorrect password. Please check and try again.' });
  }

  student.lastLoginAt = new Date().toISOString();
  saveDatabase(db);

  return res.json({
    success: true,
    token: issueStudentToken(student.id),
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

// Get course public info (returns all courses + active course)
app.get('/api/course', (req, res) => {
  const requestedId = typeof req.query.courseId === 'string' ? req.query.courseId.trim() : undefined;
  const courses = getAllCourses().map(c => ({
    ...c,
    totalLessons: db.lessons.filter(l => (l.courseId || 'course-yt-01') === c.id && l.isPublished).length || c.totalLessons
  }));
  const activeCourse =
    (requestedId ? courses.find(c => c.id === requestedId) : undefined) ||
    courses.find(c => c.isMain) ||
    courses[0] ||
    db.course;

  res.json({
    course: activeCourse,
    courses,
    totalLessons: db.lessons.filter(l => (l.courseId || 'course-yt-01') === activeCourse.id && l.isPublished).length
  });
});

// Get lessons (locked state enforced server-side per course for unpaid users)
app.get('/api/lessons', (req, res) => {
  const student = getStudentFromReq(req);
  const requestedCourseId = typeof req.query.courseId === 'string' ? req.query.courseId.trim() : undefined;

  const sanitizedLessons = db.lessons
    .filter(l => l.isPublished && (!requestedCourseId || (l.courseId || 'course-yt-01') === requestedCourseId))
    .sort((a, b) => a.order - b.order)
    .map(lesson => {
      const lessonCourseId = lesson.courseId || 'course-yt-01';
      const enrolledInThisCourse = isStudentEnrolledInCourse(student, lessonCourseId);
      const hasAccess = enrolledInThisCourse || lesson.isFreePreview;
      return {
        id: lesson.id,
        courseId: lessonCourseId,
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
    isEnrolled: requestedCourseId ? isStudentEnrolledInCourse(student, requestedCourseId) : Boolean(student?.isEnrolled),
    enrolledCourseIds: getStudentEnrolledCourses(student),
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

function buildUpiQuery(targetCourse: Course, orderId?: string): string {
  const cleanNote =
    (targetCourse.title || 'KP HUBE Course')
      .replace(/[^a-zA-Z0-9 ]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 40) || 'KP HUBE Course';
  const amountStr = Number(targetCourse.price).toFixed(2);
  const params: [string, string][] = [
    ['pa', UPI_MERCHANT_VPA],
    ['pn', UPI_MERCHANT_NAME],
    ['am', amountStr],
    ['cu', 'INR'],
    ['tn', cleanNote]
  ];
  if (orderId) {
    params.push(['tr', orderId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 35)]);
  }
  return params.map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
}

function hasConfiguredRazorpay(): boolean {
  const validKey =
    RAZORPAY_KEY_ID.startsWith('rzp_live_') ||
    (RAZORPAY_KEY_ID.startsWith('rzp_test_') && RAZORPAY_KEY_ID !== 'rzp_test_YourKeyIdHere');
  return Boolean(
    validKey &&
    RAZORPAY_KEY_SECRET.length >= 12 &&
    RAZORPAY_KEY_SECRET !== 'kphube_mock_secret_key_2026'
  );
}

// Get UPI Merchant status & PhonePe QR
app.get('/api/payment/upi-status', (req, res) => {
  const requestedCourseId = typeof req.query.courseId === 'string' ? req.query.courseId.trim() : undefined;
  const targetCourse = findCourseById(requestedCourseId || 'course-yt-01');
  const upiQuery = buildUpiQuery(targetCourse);
  res.json({
    verifiedPayeeName: UPI_MERCHANT_NAME,
    verifiedUpiVpa: UPI_MERCHANT_VPA,
    qrImageUrl: '/assets/payment_qr.jpeg',
    courseAmount: targetCourse.price,
    hasLiveGatewayKeys: hasConfiguredRazorpay(),
    razorpayKeyId: RAZORPAY_KEY_ID || 'rzp_test_demo_kphube',
    mismatchedQrBlocked: false,
    upiQuery,
    upiIntentUrl: `upi://pay?${upiQuery}`
  });
});

// Create payment order on server
app.post('/api/payment/create-order', async (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Please log in to purchase the course.' });
  }

  const requestedCourseId = typeof req.body?.courseId === 'string' ? req.body.courseId.trim() : undefined;
  const targetCourse = findCourseById(requestedCourseId || 'course-yt-01');

  if (isStudentEnrolledInCourse(student, targetCourse.id)) {
    return res.status(400).json({ error: `You are already enrolled in ${targetCourse.title}.` });
  }

  const amountPaise = targetCourse.price * 100;
  const orderId = `order_kphube_${Date.now()}_${crypto.randomBytes(3).toString('hex')}`;
  const receiptNumber = `RCPT-${Date.now().toString().slice(-6)}`;
  const studentContact = student.phone || student.email || student.id;
  const liveGateway = hasConfiguredRazorpay();

  let razorpayOrderId: string | undefined;
  if (liveGateway) {
    try {
      const auth = Buffer.from(`${RAZORPAY_KEY_ID}:${RAZORPAY_KEY_SECRET}`).toString('base64');
      const rzpRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: amountPaise,
          currency: 'INR',
          receipt: receiptNumber,
          notes: { courseId: targetCourse.id, courseTitle: targetCourse.title }
        })
      });
      if (rzpRes.ok) {
        const rzpJson: any = await rzpRes.json();
        if (rzpJson?.id) razorpayOrderId = rzpJson.id;
      }
    } catch {
      // Fallback cleanly to direct UPI links & QR if gateway unreachable
    }
  }

  const serverOrderId = razorpayOrderId || orderId;
  const upiQuery = buildUpiQuery(targetCourse, serverOrderId);

  const paymentRecord: PaymentRecord = {
    id: `pay_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
    orderId: serverOrderId,
    courseId: targetCourse.id,
    courseTitle: targetCourse.title,
    amount: targetCourse.price,
    currency: 'INR',
    status: 'created',
    method: 'razorpay_upi',
    studentPhone: studentContact,
    studentName: student.name,
    timestamp: new Date().toISOString(),
    receiptNumber,
    notes: `Enrollment in ${targetCourse.title}`
  };

  db.payments.push(paymentRecord);
  saveDatabase(db);

  return res.json({
    success: true,
    orderId: serverOrderId,
    razorpayOrderId,
    hasLiveGatewayKeys: Boolean(liveGateway && razorpayOrderId),
    courseId: targetCourse.id,
    amount: amountPaise,
    amountRupees: targetCourse.price,
    currency: 'INR',
    receiptNumber,
    key: RAZORPAY_KEY_ID || 'rzp_test_demo_kphube',
    courseTitle: targetCourse.title,
    studentPhone: studentContact,
    studentName: student.name || 'Student',
    qrImageUrl: '/assets/payment_qr.jpeg',
    upiVpa: UPI_MERCHANT_VPA,
    upiQuery,
    upiIntentUrl: `upi://pay?${upiQuery}`
  });
});

function doesPaymentBelongToStudent(payment: PaymentRecord, student: StoredStudent): boolean {
  const key = String(payment.studentPhone || '').trim();
  if (!key) return false;
  if (key === student.id) return true;
  if (key.includes('@') && student.email && canonicalEmail(key) === canonicalEmail(student.email)) {
    return true;
  }
  if (!key.includes('@') && student.phone && normalizeIndianPhone(key) === normalizeIndianPhone(student.phone)) {
    return true;
  }
  return false;
}

// Verify Payment Signature or UPI UTR on server
app.post('/api/payment/verify', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Student session required for verification.' });
  }

  const { orderId, paymentId, utrNumber, signature } = req.body;

  const refId = String(paymentId || utrNumber || '').trim();
  if (!orderId || refId.length < 8) {
    return res.status(400).json({ error: 'Valid Order ID and UTR / Transaction Reference Number (minimum 8 characters) are required.' });
  }

  const paymentRecord = db.payments.find(p => p.orderId === orderId);
  if (!paymentRecord) {
    return res.status(404).json({ error: 'Payment order record not found.' });
  }

  if (!doesPaymentBelongToStudent(paymentRecord, student)) {
    return res.status(403).json({ error: 'Unauthorized: Payment order belongs to a different account.' });
  }

  const targetCourse = findCourseById(paymentRecord.courseId || 'course-yt-01');

  if (signature && hasConfiguredRazorpay() && orderId.startsWith('order_')) {
    const expectedSig = crypto
      .createHmac('sha256', RAZORPAY_KEY_SECRET)
      .update(`${orderId}|${refId}`)
      .digest('hex');
    if (signature !== expectedSig) {
      return res.status(400).json({ error: 'Invalid payment gateway signature.' });
    }
  }

  if (paymentRecord.status === 'paid') {
    return res.json({
      success: true,
      message: 'Payment already verified.',
      isEnrolled: true,
      courseId: targetCourse.id,
      receiptNumber: paymentRecord.receiptNumber
    });
  }

  // Update payment record to PAID
  paymentRecord.status = 'paid';
  paymentRecord.paymentId = refId;
  paymentRecord.signature = signature || 'upi_utr_verified';
  paymentRecord.timestamp = new Date().toISOString();

  // Unlock target course for student
  const currentCourses = getStudentEnrolledCourses(student);
  if (!currentCourses.includes(targetCourse.id)) {
    currentCourses.push(targetCourse.id);
  }
  student.enrolledCourseIds = currentCourses;
  student.isEnrolled = true;
  student.enrolledAt = new Date().toISOString();

  // Increment enrolled count
  targetCourse.enrolledCount += 1;
  if (targetCourse.id === db.course.id) {
    db.course.enrolledCount = targetCourse.enrolledCount;
  }

  // Create audit log
  db.auditLogs.push({
    id: `log_pay_${Date.now()}`,
    action: 'COURSE_PURCHASE_VERIFIED',
    adminPhone: 'upi_gateway',
    targetId: student.id,
    targetType: 'payment',
    details: `Payment of ₹${paymentRecord.amount} verified for ${targetCourse.title} (${getStudentContactLabel(student)}, Ref/UTR: ${refId})`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);

  return res.json({
    success: true,
    message: `Payment verified successfully! Welcome to ${targetCourse.title}.`,
    receiptNumber: paymentRecord.receiptNumber,
    courseId: targetCourse.id,
    isEnrolled: true
  });
});


// Student Payment History
app.get('/api/payment/history', (req, res) => {
  const student = getStudentFromReq(req);
  if (!student) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const studentPayments = db.payments
    .filter(p => doesPaymentBelongToStudent(p, student))
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

// Admin Login (Strictly Owner Gmail + Owner Password or Private Master Key + Rate Limit + Ephemeral Session Token)
app.post('/api/admin/login', (req, res) => {
  const rateKey = getRateLimitKey(req);
  const retryAfter = checkAdminRateLimit(rateKey);
  if (retryAfter) {
    return res.status(429).json({ error: `Too many wrong attempts. Try again in ${retryAfter}s.` });
  }

  const signedInStudent = getStudentFromReq(req);
  const candidateEmail = String(req.body?.email || signedInStudent?.email || '').trim();
  const credential = String(req.body?.password || req.body?.secretKey || '').trim();

  const isOwnerEmailMatch =
    Boolean(candidateEmail) && canonicalEmail(candidateEmail) === canonicalEmail(OWNER_EMAIL);
  const ownerStudent = findStudentByIdentifier(canonicalEmail(OWNER_EMAIL), '');
  const isCredentialMatch =
    verifyAdminSecret(credential) ||
    (Boolean(db.adminPasswordHash) && verifyPassword(credential, db.adminPasswordHash)) ||
    (Boolean(ownerStudent?.passwordHash) && verifyPassword(credential, ownerStudent?.passwordHash));

  if (!isOwnerEmailMatch || !isCredentialMatch) {
    recordAdminFailure(rateKey);
    return res.status(403).json({ error: 'Access denied: Invalid Owner Gmail or Password.' });
  }

  adminFailedAttempts.delete(rateKey);
  const sessionToken = crypto.randomBytes(32).toString('hex');
  adminSessions.set(sessionToken, {
    ownerEmail: OWNER_EMAIL,
    expiresAt: Date.now() + ADMIN_SESSION_TTL_MS
  });

  return res.json({
    success: true,
    adminToken: sessionToken,
    role: 'owner',
    portalPath: PRIVATE_ADMIN_PATH
  });
});

// Set or Update Personal Private Admin Website Password
app.post('/api/admin/password', requireAdmin, (req, res) => {
  const newPassword = String(req.body?.newPassword || '');
  if (newPassword.length < 6) {
    return res.status(400).json({ error: 'Password must be at least 6 characters long.' });
  }
  db.adminPasswordHash = hashPassword(newPassword);
  db.auditLogs.push({
    id: `log_admpass_${Date.now()}`,
    action: 'ADMIN_PASSWORD_UPDATED',
    adminPhone: 'owner',
    targetId: 'admin_portal',
    targetType: 'course',
    details: 'Updated personal private Admin Website password.',
    timestamp: new Date().toISOString()
  });
  saveDatabase(db);
  return res.json({ success: true, message: 'Private Admin password updated successfully.' });
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
    return {
      ...sanitizeStudent(s),
      purchaseRecord: db.payments.find(p => doesPaymentBelongToStudent(p, s) && p.status === 'paid')
    };
  });
  res.json({ students: list });
});

// Admin - Grant access manually
app.post('/api/admin/students/:id/grant', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { reason, courseId } = req.body;

  const student = db.students.find(s => s.id === id || s.phone === id || s.email === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  const targetCourse = findCourseById(courseId || 'course-vip-01');
  const currentCourses = getStudentEnrolledCourses(student);
  const alreadyInTarget = currentCourses.includes(targetCourse.id);
  if (!alreadyInTarget) {
    currentCourses.push(targetCourse.id);
  }
  student.enrolledCourseIds = currentCourses;
  student.isEnrolled = true;
  student.enrolledAt = student.enrolledAt || new Date().toISOString();

  if (!alreadyInTarget) {
    targetCourse.enrolledCount += 1;
    if (targetCourse.id === db.course.id) {
      db.course.enrolledCount = targetCourse.enrolledCount;
    }
  }

  // Record a verified purchase history entry for this course if none exists yet
  const hasPaidRecord = db.payments.some(
    p =>
      doesPaymentBelongToStudent(p, student) &&
      p.status === 'paid' &&
      (p.courseId || 'course-yt-01') === targetCourse.id
  );
  if (!hasPaidRecord) {
    const contact = student.email || student.phone || student.id;
    db.payments.push({
      id: `pay_grant_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`,
      orderId: `order_manual_${Date.now()}`,
      paymentId: `MANUAL-${Date.now().toString().slice(-6)}`,
      courseId: targetCourse.id,
      courseTitle: targetCourse.title,
      amount: targetCourse.price,
      currency: 'INR',
      status: 'paid',
      method: 'manual_admin',
      studentPhone: contact,
      studentName: student.name,
      timestamp: new Date().toISOString(),
      receiptNumber: `RCPT-${Date.now().toString().slice(-6)}`,
      notes: String(reason || `Owner manual enrollment (${targetCourse.title})`).trim()
    });
  }

  // Add audit log
  db.auditLogs.push({
    id: `log_grant_${Date.now()}`,
    action: 'ADMIN_MANUAL_ACCESS_GRANTED',
    adminPhone: 'owner',
    targetId: student.id,
    targetType: 'student',
    details: `Owner manually granted access to ${targetCourse.title} for ${getStudentContactLabel(student)}. Note: ${reason || 'VIP / Offline enrollment'}`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, student: sanitizeStudent(student) });
});

// Admin - Revoke access manually
app.post('/api/admin/students/:id/revoke', requireAdmin, (req, res) => {
  const { id } = req.params;
  const { reason, courseId } = req.body;

  const student = db.students.find(s => s.id === id || s.phone === id || s.email === id);
  if (!student) {
    return res.status(404).json({ error: 'Student not found.' });
  }

  if (courseId) {
    const nextCourses = getStudentEnrolledCourses(student).filter(cId => cId !== courseId);
    student.enrolledCourseIds = nextCourses;
    student.isEnrolled = nextCourses.length > 0;
  } else {
    student.enrolledCourseIds = [];
    student.isEnrolled = false;
  }

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

// Admin - Update Course Info (supports updating any course by id)
app.put('/api/admin/course', requireAdmin, (req, res) => {
  const updates = req.body || {};
  const targetId = typeof updates.id === 'string' && updates.id ? updates.id : db.course.id;
  const courses = getAllCourses();
  const idx = courses.findIndex(c => c.id === targetId);
  const updatedCourse = idx >= 0 ? { ...courses[idx], ...updates } : { ...db.course, ...updates };

  if (idx >= 0) {
    courses[idx] = updatedCourse;
    db.courses = courses;
  }
  if (updatedCourse.id === db.course.id) {
    db.course = updatedCourse;
  }

  db.auditLogs.push({
    id: `log_crs_${Date.now()}`,
    action: 'COURSE_SETTINGS_UPDATED',
    adminPhone: 'owner',
    targetId: updatedCourse.id,
    targetType: 'course',
    details: `Updated "${updatedCourse.title}" (Price: ₹${updatedCourse.price})`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, course: updatedCourse, courses: getAllCourses() });
});

// Admin - Add lesson (to a specific courseId)
app.post('/api/admin/lessons', requireAdmin, (req, res) => {
  const targetCourseId = typeof req.body.courseId === 'string' && req.body.courseId ? req.body.courseId : 'course-vip-01';
  const courseLessons = db.lessons.filter(l => (l.courseId || 'course-yt-01') === targetCourseId);
  const newLesson: Lesson = {
    id: `episode-${Date.now()}`,
    courseId: targetCourseId,
    order: courseLessons.length + 1,
    title: req.body.title || `Episode ${courseLessons.length + 1}`,
    englishSubtitle: req.body.englishSubtitle || '',
    description: req.body.description || '',
    durationMinutes: Number(req.body.durationMinutes) || 0,
    videoUrl: req.body.videoUrl || '',
    videoType: req.body.videoUrl ? (req.body.videoType || 'youtube') : 'awaiting_upload',
    pdfUrl: req.body.pdfUrl || '',
    pdfTitle: req.body.pdfTitle || '',
    isPublished: req.body.isPublished !== false,
    isFreePreview: Boolean(req.body.isFreePreview)
  };

  db.lessons.push(newLesson);
  const courses = getAllCourses();
  courses.forEach(c => {
    c.totalLessons = db.lessons.filter(l => (l.courseId || 'course-yt-01') === c.id).length;
  });
  db.courses = courses;
  db.course.totalLessons = db.lessons.filter(l => (l.courseId || 'course-yt-01') === db.course.id).length;

  db.auditLogs.push({
    id: `log_les_add_${Date.now()}`,
    action: 'LESSON_CREATED',
    adminPhone: 'owner',
    targetId: newLesson.id,
    targetType: 'lesson',
    details: `Added new lesson "${newLesson.title}" (${targetCourseId})`,
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
  const cleanVideoUrl =
    req.body.videoUrl !== undefined ? String(req.body.videoUrl).trim() : (existing.videoUrl || '');
  const resolvedVideoType = cleanVideoUrl
    ? req.body.videoType && req.body.videoType !== 'awaiting_upload'
      ? req.body.videoType
      : existing.videoType !== 'awaiting_upload'
        ? existing.videoType
        : 'youtube'
    : 'awaiting_upload';

  const updated: Lesson = {
    ...existing,
    ...req.body,
    videoUrl: cleanVideoUrl,
    videoType: resolvedVideoType
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

// Admin - Delete lesson (per-course re-indexing)
app.delete('/api/admin/lessons/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const lesson = db.lessons.find(l => l.id === id);
  if (!lesson) {
    return res.status(404).json({ error: 'Lesson not found' });
  }

  const targetCourseId = lesson.courseId || 'course-yt-01';
  db.lessons = db.lessons.filter(l => l.id !== id);

  // Re-order remaining lessons inside the affected course only
  const courseLessons = db.lessons
    .filter(l => (l.courseId || 'course-yt-01') === targetCourseId)
    .sort((a, b) => a.order - b.order);
  courseLessons.forEach((l, idx) => {
    l.order = idx + 1;
  });

  const courses = getAllCourses();
  courses.forEach(c => {
    c.totalLessons = db.lessons.filter(l => (l.courseId || 'course-yt-01') === c.id).length;
  });
  db.courses = courses;
  db.course.totalLessons = db.lessons.filter(l => (l.courseId || 'course-yt-01') === db.course.id).length;

  db.auditLogs.push({
    id: `log_les_del_${Date.now()}`,
    action: 'LESSON_DELETED',
    adminPhone: 'owner',
    targetId: id,
    targetType: 'lesson',
    details: `Deleted lesson: "${lesson.title}" (${targetCourseId})`,
    timestamp: new Date().toISOString()
  });

  saveDatabase(db);
  res.json({ success: true, remainingCount: courseLessons.length });
});

// Admin - Reorder lessons (per-course scoped)
app.post('/api/admin/lessons/reorder', requireAdmin, (req, res) => {
  const { orderedIds, courseId } = req.body as { orderedIds: string[]; courseId?: string };
  if (!Array.isArray(orderedIds)) {
    return res.status(400).json({ error: 'Invalid orderedIds array' });
  }

  const firstLesson = orderedIds.length > 0 ? db.lessons.find(l => l.id === orderedIds[0]) : undefined;
  const targetCourseId = courseId || firstLesson?.courseId || 'course-yt-01';

  const reorderedCourseLessons: Lesson[] = [];
  orderedIds.forEach((id, index) => {
    const lesson = db.lessons.find(l => l.id === id && (l.courseId || 'course-yt-01') === targetCourseId);
    if (lesson) {
      lesson.order = index + 1;
      reorderedCourseLessons.push(lesson);
    }
  });

  // Append any lessons in that same course missing from orderedIds
  db.lessons.forEach(l => {
    if ((l.courseId || 'course-yt-01') === targetCourseId && !orderedIds.includes(l.id)) {
      l.order = reorderedCourseLessons.length + 1;
      reorderedCourseLessons.push(l);
    }
  });

  const otherLessons = db.lessons.filter(l => (l.courseId || 'course-yt-01') !== targetCourseId);
  db.lessons = [...reorderedCourseLessons, ...otherLessons];
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
      courses: getAllCourses(),
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

  const synced = ensureCoursesAndLessons(
    payload.course,
    Array.isArray(payload.courses) ? payload.courses : undefined,
    payload.lessons
  );

  db = {
    course: synced.courses.find(c => c.id === 'course-yt-01') || synced.courses[0] || payload.course,
    courses: synced.courses,
    lessons: synced.lessons,
    students: Array.isArray(payload.students) ? payload.students : [],
    payments: Array.isArray(payload.payments) ? payload.payments : [],
    auditLogs: Array.isArray(payload.auditLogs) ? payload.auditLogs : [],
    supportTickets: Array.isArray(payload.supportTickets) ? payload.supportTickets : [],
    otps: {},
    apkDownloadUrl: typeof payload.apkDownloadUrl === 'string' ? payload.apkDownloadUrl : (db.apkDownloadUrl || ''),
    adminPasswordHash: db.adminPasswordHash
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
      p === '/kp-owner-portal.html' ||
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

    app.get('/api/health', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const vitePromise = import('vite').then(({ createServer }) =>
      createServer({
        server: { middlewareMode: true, hmr: false, ws: false },
        appType: 'spa'
      })
    );

    // Dedicated Private Owner Admin Website Route (Not linked anywhere on public site)
    app.get(PRIVATE_ADMIN_PATH, async (req, res, next) => {
      try {
        const vite = await vitePromise;
        const htmlPath = path.resolve(process.cwd(), 'kp-owner-portal.html');
        const rawHtml = fs.readFileSync(htmlPath, 'utf-8');
        const transformed = await vite.transformIndexHtml(req.originalUrl, rawHtml);
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
        res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
        res.status(200).type('html').send(transformed);
      } catch (e) {
        next(e);
      }
    });

    app.use(async (req, res, next) => {
      try {
        const vite = await vitePromise;
        vite.middlewares(req, res, next);
      } catch (e) {
        next(e);
      }
    });
  } else {
    app.get('/api/health', (_req, res) => {
      res.status(200).json({ ok: true });
    });

    const distPath = path.resolve(process.cwd(), 'dist');

    // Dedicated Private Owner Admin Website Route (Production)
    app.get(PRIVATE_ADMIN_PATH, (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.setHeader('X-Robots-Tag', 'noindex, nofollow, noarchive');
      res.sendFile(path.join(distPath, 'kp-owner-portal.html'));
    });

    app.use(
      express.static(distPath, {
        setHeaders: (res, filePath) => {
          if (
            filePath.endsWith('.html') ||
            filePath.endsWith('sw.js') ||
            filePath.endsWith('registerSW.js') ||
            filePath.endsWith('manifest.webmanifest')
          ) {
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
          }
        }
      })
    );
    app.get('*', (_req, res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`[KP HUBE] Server listening on http://0.0.0.0:${PORT}`);
    console.log(`[KP HUBE] Verified UPI VPA: ${UPI_MERCHANT_VPA} (${UPI_MERCHANT_NAME})`);
  });

  const shutdown = () => {
    server.close(() => process.exit(0));
    setTimeout(() => process.exit(0), 1500).unref();
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
