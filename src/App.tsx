import React, { useState, useEffect } from 'react';
import { api, storage } from './services/api.ts';
import type { Course, Lesson, Student, PaymentRecord } from './types/index.ts';
import { KPNavbar } from './components/KPNavbar.tsx';
import { BottomNav } from './components/BottomNav.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { PaymentModal } from './components/PaymentModal.tsx';
import { ReceiptModal } from './components/ReceiptModal.tsx';
import { SupportModal } from './components/SupportModal.tsx';
import { AccountDeletionModal } from './components/AccountDeletionModal.tsx';
import { HomeScreen } from './views/HomeScreen.tsx';
import { CourseDetailsScreen } from './views/CourseDetailsScreen.tsx';
import { MyCourseScreen } from './views/MyCourseScreen.tsx';
import { ProfileScreen } from './views/ProfileScreen.tsx';
import { OfflineIndicator } from './components/PWAInstallButton.tsx';
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<'home' | 'course' | 'profile'>('home');
  const [apkAvailable, setApkAvailable] = useState<boolean>(false);

  // Core Data
  const [course, setCourse] = useState<Course | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourseId, setSelectedCourseId] = useState<string>('course-vip-01');
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authInitialPhone, setAuthInitialPhone] = useState('');
  const [authInitialMode, setAuthInitialMode] = useState<'login' | 'register'>('login');
  const [pendingPaymentAfterAuth, setPendingPaymentAfterAuth] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentCourseId, setPaymentCourseId] = useState<string | undefined>(undefined);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  const isEnrolledInCourse = (s: Student | null, courseId: string): boolean => {
    if (!s) return false;
    if (Array.isArray(s.enrolledCourseIds) && s.enrolledCourseIds.length > 0) {
      return s.enrolledCourseIds.includes(courseId);
    }
    return Boolean(s.isEnrolled && courseId === 'course-yt-01');
  };

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [courseRes, lessonsRes, apkRes] = await Promise.all([
        api.getCourse(),
        api.getLessons(),
        api.getApkStatus()
      ]);
      setCourse(courseRes.course);
      const allCourses = courseRes.courses && courseRes.courses.length > 0 ? courseRes.courses : [courseRes.course];
      setCourses(allCourses);
      setSelectedCourseId(prev =>
        allCourses.some(c => c.id === prev)
          ? prev
          : (allCourses.find(c => c.isMain)?.id || courseRes.course.id)
      );
      setLessons(lessonsRes.lessons);
      setApkAvailable(apkRes.available);

      // Check current session
      if (storage.getStudentPhone()) {
        try {
          const meRes = await api.getMe();
          setStudent(meRes.student);
        } catch {
          storage.removeStudentPhone();
          storage.removeAdminToken();
          setStudent(null);
        }
      } else {
        storage.removeAdminToken();
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to KP HUBE server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  const handleRefreshStudent = async () => {
    if (storage.getStudentPhone()) {
      try {
        const [meRes, lsnRes, courseRes] = await Promise.all([
          api.getMe(),
          api.getLessons(),
          api.getCourse()
        ]);
        setStudent(meRes.student);
        setLessons(lsnRes.lessons);
        if (courseRes.courses) setCourses(courseRes.courses);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    await handleRefreshStudent();
    if (paymentCourseId) {
      setSelectedCourseId(paymentCourseId);
    }
    setCurrentTab('course');
  };

  const openAuthModal = (
    prefill = '',
    mode: 'login' | 'register' = 'login',
    afterPayment = false
  ) => {
    setAuthInitialPhone(prefill);
    setAuthInitialMode(mode);
    setPendingPaymentAfterAuth(afterPayment);
    setShowAuthModal(true);
  };

  const openPaymentForCourse = (courseId?: string) => {
    const targetId = courseId || selectedCourseId;
    setPaymentCourseId(targetId);
    if (!student) {
      openAuthModal('', 'login', true);
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleLogout = () => {
    storage.removeStudentPhone();
    storage.removeAdminToken();
    setStudent(null);
    setSelectedLessonId(undefined);
    setCurrentTab('home');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f1f5ff] to-[#e8f7f3] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] text-white flex items-center justify-center font-bold text-base shadow-lg animate-pulse mb-3">
          KP
        </div>
        <Loader2 className="w-6 h-6 text-[#4f46e5] animate-spin mb-2" />
        <span className="font-brand font-bold text-[#14213d] text-base">KP HUBE</span>
        <span className="text-[11px] text-[#4f46e5] font-semibold tracking-wider uppercase">LEARN • GROW • SUCCEED</span>
      </div>
    );
  }

  if (error && !course) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#f1f5ff] to-[#e8f7f3] flex items-center justify-center p-4">
        <div className="max-w-sm bg-white p-6 rounded-2xl border border-slate-200 text-center space-y-3 shadow-md">
          <AlertCircle className="w-10 h-10 text-rose-600 mx-auto" />
          <h2 className="font-brand font-bold text-slate-900 text-base">Server Connection Error</h2>
          <p className="text-xs text-slate-500">{error}</p>
          <button
            onClick={() => { setLoading(true); setError(null); loadInitialData(); }}
            className="w-full py-2 bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] text-white font-medium text-xs rounded-xl"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const allCourses = courses.length > 0 ? courses : (course ? [course] : []);
  const activeCourse = allCourses.find(c => c.id === selectedCourseId) || allCourses[0] || course!;
  const activeCourseLessons = lessons.filter(l => (l.courseId || 'course-yt-01') === activeCourse.id);
  const enrolledInActive = isEnrolledInCourse(student, activeCourse.id);
  const paymentCourse = allCourses.find(c => c.id === paymentCourseId) || activeCourse;

  const activePreviewLesson = selectedLessonId
    ? activeCourseLessons.find(l => l.id === selectedLessonId && l.isFreePreview)
    : undefined;
  const showCoursePlayer = Boolean(enrolledInActive || activePreviewLesson);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5ff] to-[#e8f7f3] text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar */}
      <KPNavbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setSelectedLessonId(undefined);
          setCurrentTab(tab);
        }}
        student={student}
        onOpenAuth={() => openAuthModal()}
        apkAvailable={apkAvailable}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center py-4 sm:py-6 px-3 sm:px-4">
        {/* Live Responsive Website & Mobile App View */}
        <div className="w-full max-w-4xl transition-all">
          <div className="w-full min-h-[640px] bg-white rounded-3xl shadow-[0_14px_32px_rgba(35,49,91,0.10)] border border-slate-100 p-4 sm:p-6 relative pb-20">

            {/* Active Tab Screen */}
            {currentTab === 'home' ? (
              <HomeScreen
                course={activeCourse}
                courses={allCourses}
                lessons={lessons}
                student={student}
                onViewCourse={(targetCourseId?: string) => {
                  if (targetCourseId) setSelectedCourseId(targetCourseId);
                  setSelectedLessonId(undefined);
                  setCurrentTab('course');
                }}
                onGoToMyCourse={(targetCourseId?: string) => {
                  if (targetCourseId) setSelectedCourseId(targetCourseId);
                  setCurrentTab('course');
                }}
                onOpenLesson={(lesson) => {
                  const lessonCourseId = lesson.courseId || activeCourse.id;
                  setSelectedCourseId(lessonCourseId);
                  if (lesson.isFreePreview || isEnrolledInCourse(student, lessonCourseId)) {
                    setSelectedLessonId(lesson.id);
                    setCurrentTab('course');
                  } else {
                    openPaymentForCourse(lessonCourseId);
                  }
                }}
                onOpenPayment={(targetCourseId?: string) => openPaymentForCourse(targetCourseId)}
              />
            ) : currentTab === 'course' ? (
              showCoursePlayer ? (
                <MyCourseScreen
                  course={activeCourse}
                  courses={allCourses}
                  onSelectCourse={(id) => {
                    setSelectedCourseId(id);
                    setSelectedLessonId(undefined);
                  }}
                  lessons={activeCourseLessons}
                  student={student}
                  isEnrolled={enrolledInActive}
                  onOpenPayment={() => openPaymentForCourse(activeCourse.id)}
                  selectedLessonId={selectedLessonId}
                  onRefreshStudent={handleRefreshStudent}
                  onBackToCourse={!enrolledInActive ? () => setSelectedLessonId(undefined) : undefined}
                />
              ) : (
                <CourseDetailsScreen
                  course={activeCourse}
                  courses={allCourses}
                  onSelectCourse={(id) => {
                    setSelectedCourseId(id);
                    setSelectedLessonId(undefined);
                  }}
                  lessons={activeCourseLessons}
                  student={student}
                  isEnrolled={enrolledInActive}
                  onOpenPayment={() => openPaymentForCourse(activeCourse.id)}
                  onOpenLesson={(lesson) => {
                    if (lesson.isFreePreview || enrolledInActive) {
                      setSelectedLessonId(lesson.id);
                    } else {
                      openPaymentForCourse(activeCourse.id);
                    }
                  }}
                />
              )
            ) : (
              <ProfileScreen
                student={student}
                coursePrice={activeCourse?.price}
                totalLessons={activeCourseLessons.length || activeCourse?.totalLessons}
                onOpenAuth={() => openAuthModal()}
                onLogout={handleLogout}
                onGoToCourse={() => {
                  setSelectedLessonId(undefined);
                  setCurrentTab('course');
                }}
                onOpenSupport={() => setShowSupportModal(true)}
                onOpenAccountDeletion={() => setShowAccountDeletionModal(true)}
                onViewReceipt={(payment) => setSelectedReceipt(payment)}
                onRefreshStudent={handleRefreshStudent}
              />
            )}
          </div>
        </div>
      </main>

      {/* Fixed Bottom Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab !== 'course') setSelectedLessonId(undefined);
          setCurrentTab(tab);
        }}
        isEnrolled={Boolean(student?.isEnrolled)}
      />

      {/* Global Modals */}
      <AuthModal
        isOpen={showAuthModal}
        initialPhone={authInitialPhone}
        initialMode={authInitialMode}
        onClose={() => {
          setShowAuthModal(false);
          setPendingPaymentAfterAuth(false);
        }}
        onSuccess={(loggedStudent) => {
          setStudent(loggedStudent);
          handleRefreshStudent();
          const targetPayId = paymentCourseId || activeCourse.id;
          if (pendingPaymentAfterAuth && !isEnrolledInCourse(loggedStudent, targetPayId)) {
            setPendingPaymentAfterAuth(false);
            setShowPaymentModal(true);
          } else {
            setPendingPaymentAfterAuth(false);
          }
        }}
      />

      <PaymentModal
        isOpen={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        student={student}
        course={paymentCourse}
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
        course={allCourses.find(c => c.id === selectedReceipt?.courseId) || activeCourse}
        totalLessons={activeCourseLessons.length || activeCourse?.totalLessons}
      />

      <SupportModal
        isOpen={showSupportModal}
        onClose={() => setShowSupportModal(false)}
        student={student}
      />

      <AccountDeletionModal
        isOpen={showAccountDeletionModal}
        onClose={() => setShowAccountDeletionModal(false)}
        onDeleted={handleLogout}
      />

      <OfflineIndicator />
    </div>
  );
}
