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
import { FourCardsConceptView } from './views/FourCardsConceptView.tsx';
import { HomeScreen } from './views/HomeScreen.tsx';
import { CourseDetailsScreen } from './views/CourseDetailsScreen.tsx';
import { MyCourseScreen } from './views/MyCourseScreen.tsx';
import { ProfileScreen } from './views/ProfileScreen.tsx';
import { AdminDashboard } from './views/AdminDashboard.tsx';
import { OfflineIndicator } from './components/PWAInstallButton.tsx';
import { Loader2, AlertCircle } from 'lucide-react';

function isOwnerRoute(): boolean {
  if (typeof window === 'undefined') return false;
  const p = window.location.pathname.toLowerCase();
  const h = window.location.hash.toLowerCase();
  return p === '/owner' || p === '/admin' || h === '#owner' || h === '#admin';
}

export default function App() {
  // App Mode: 'live_app' (Full Website / Mobile App) or 'concept_4cards' (4-Screen Showcase)
  const [appMode, setAppMode] = useState<'concept_4cards' | 'live_app'>('live_app');
  const [currentTab, setCurrentTab] = useState<'home' | 'course' | 'profile'>('home');
  const [isAdminActive, setIsAdminActive] = useState<boolean>(() => isOwnerRoute());
  const [apkAvailable, setApkAvailable] = useState<boolean>(false);

  // Core Data
  const [course, setCourse] = useState<Course | null>(null);
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
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [courseRes, lessonsRes, apkRes] = await Promise.all([
        api.getCourse(),
        api.getLessons(),
        api.getApkStatus()
      ]);
      setCourse(courseRes.course);
      setLessons(lessonsRes.lessons);
      setApkAvailable(apkRes.available);

      // Check current session
      if (storage.getStudentPhone()) {
        try {
          const meRes = await api.getMe();
          setStudent(meRes.student);
        } catch {
          storage.removeStudentPhone();
          setStudent(null);
        }
      }
    } catch (err: any) {
      setError(err.message || 'Failed to connect to KP HUBE server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
    const onHashChange = () => {
      if (isOwnerRoute()) {
        setIsAdminActive(true);
      }
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  const handleRefreshStudent = async () => {
    if (storage.getStudentPhone()) {
      try {
        const meRes = await api.getMe();
        setStudent(meRes.student);
        const lsnRes = await api.getLessons();
        setLessons(lsnRes.lessons);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handlePaymentSuccess = async () => {
    await handleRefreshStudent();
    setCurrentTab('course');
    setAppMode('live_app');
  };

  const handleLogout = () => {
    storage.removeStudentPhone();
    setStudent(null);
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

  const canAccessAdmin = Boolean(student?.isOwner || storage.getAdminToken());

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#f1f5ff] to-[#e8f7f3] text-slate-900 flex flex-col selection:bg-indigo-100 selection:text-indigo-900">
      {/* Top Bar */}
      <KPNavbar
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setIsAdminActive(false);
          setAppMode('live_app');
          setCurrentTab(tab);
        }}
        student={student}
        onOpenAuth={() => setShowAuthModal(true)}
        onOpenAdmin={() => setIsAdminActive(!isAdminActive)}
        isAdminActive={isAdminActive}
        canAccessAdmin={canAccessAdmin}
        apkAvailable={apkAvailable}
        appMode={appMode}
        onToggleAppMode={(mode) => {
          setIsAdminActive(false);
          setAppMode(mode);
        }}
      />

      {/* Main Content Area */}
      <main className="flex-1 flex justify-center py-4 sm:py-6 px-3 sm:px-4">
        {isAdminActive ? (
          <div className="w-full max-w-5xl">
            <AdminDashboard
              onExit={() => setIsAdminActive(false)}
              onRefreshData={loadInitialData}
            />
          </div>
        ) : appMode === 'concept_4cards' ? (
          /* Exact 4 Cards Concept Showcase (Matching Demo Photo 1:1) */
          <div className="w-full max-w-7xl">
            <FourCardsConceptView
              course={course!}
              lessons={lessons}
              student={student}
              onOpenAuth={(prefill, mode = 'login') => {
                setAuthInitialPhone(prefill || '');
                setAuthInitialMode(mode);
                setPendingPaymentAfterAuth(false);
                setShowAuthModal(true);
              }}
              onOpenPayment={() => {
                if (!student) {
                  setPendingPaymentAfterAuth(true);
                  setShowAuthModal(true);
                } else {
                  setShowPaymentModal(true);
                }
              }}
              onOpenCourse={() => {
                setAppMode('live_app');
                setCurrentTab('course');
              }}
              onOpenLesson={(lesson) => {
                setSelectedLessonId(lesson.id);
                setAppMode('live_app');
                setCurrentTab('course');
              }}
            />
          </div>
        ) : (
          /* Live Responsive Website & Mobile App View */
          <div className="w-full max-w-4xl transition-all">
            <div className="w-full min-h-[640px] bg-white rounded-3xl shadow-[0_14px_32px_rgba(35,49,91,0.10)] border border-slate-100 p-4 sm:p-6 relative pb-20">

              {/* Active Tab Screen */}
              {currentTab === 'home' ? (
                <HomeScreen
                  course={course!}
                  student={student}
                  onViewCourse={() => setCurrentTab('course')}
                  onGoToMyCourse={() => setCurrentTab('course')}
                  onOpenPayment={() => {
                    if (!student) {
                      setShowAuthModal(true);
                    } else {
                      setShowPaymentModal(true);
                    }
                  }}
                />
              ) : currentTab === 'course' ? (
                student?.isEnrolled ? (
                  <MyCourseScreen
                    course={course!}
                    lessons={lessons}
                    student={student}
                    onOpenPayment={() => setShowPaymentModal(true)}
                    selectedLessonId={selectedLessonId}
                    onRefreshStudent={handleRefreshStudent}
                  />
                ) : (
                  <CourseDetailsScreen
                    course={course!}
                    lessons={lessons}
                    student={student}
                    onOpenPayment={() => {
                      if (!student) {
                        setShowAuthModal(true);
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}
                    onOpenLesson={(lesson) => {
                      if (lesson.isFreePreview || student?.isEnrolled) {
                        setSelectedLessonId(lesson.id);
                      } else {
                        setShowPaymentModal(true);
                      }
                    }}
                  />
                )
              ) : (
                <ProfileScreen
                  student={student}
                  onOpenAuth={() => setShowAuthModal(true)}
                  onLogout={handleLogout}
                  onGoToCourse={() => setCurrentTab('course')}
                  onOpenSupport={() => setShowSupportModal(true)}
                  onOpenAccountDeletion={() => setShowAccountDeletionModal(true)}
                  onViewReceipt={(payment) => setSelectedReceipt(payment)}
                  onRefreshStudent={handleRefreshStudent}
                  onOpenOwnerConsole={canAccessAdmin ? () => setIsAdminActive(true) : undefined}
                />
              )}
            </div>
          </div>
        )}
      </main>

      {/* Fixed Bottom Navigation (in single live app mode) */}
      {!isAdminActive && appMode === 'live_app' && (
        <BottomNav
          currentTab={currentTab}
          onSelectTab={(tab) => {
            setIsAdminActive(false);
            setCurrentTab(tab);
          }}
          isEnrolled={student?.isEnrolled || false}
        />
      )}

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
          if (pendingPaymentAfterAuth && !loggedStudent.isEnrolled) {
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
        onPaymentSuccess={handlePaymentSuccess}
      />

      <ReceiptModal
        isOpen={Boolean(selectedReceipt)}
        onClose={() => setSelectedReceipt(null)}
        payment={selectedReceipt}
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
