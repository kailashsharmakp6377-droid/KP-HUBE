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
import { Loader2, AlertCircle } from 'lucide-react';

export default function App() {
  // App Mode: 'concept_4cards' (Matches Demo photo) or 'live_app'
  const [appMode, setAppMode] = useState<'concept_4cards' | 'live_app'>('concept_4cards');
  const [currentTab, setCurrentTab] = useState<'home' | 'course' | 'profile'>('home');
  const [isAdminActive, setIsAdminActive] = useState(false);

  // Core Data
  const [course, setCourse] = useState<Course | null>(null);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [student, setStudent] = useState<Student | null>(null);
  const [selectedLessonId, setSelectedLessonId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showAccountDeletionModal, setShowAccountDeletionModal] = useState(false);
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentRecord | null>(null);

  // Initial Data Fetch
  const loadInitialData = async () => {
    try {
      const [courseRes, lessonsRes] = await Promise.all([
        api.getCourse(),
        api.getLessons()
      ]);
      setCourse(courseRes.course);
      setLessons(lessonsRes.lessons);

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
              onOpenAuth={() => setShowAuthModal(true)}
              onOpenPayment={() => {
                if (!student) setShowAuthModal(true);
                else setShowPaymentModal(true);
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
          /* Single Card / Live App Screen (Exact 330px x 640px Card Sizing) */
          <div className="w-full max-w-[340px] sm:max-w-[420px] transition-all">
            <div className="w-full min-h-[640px] bg-white rounded-[34px] shadow-[0_14px_32px_rgba(35,49,91,0.14)] border border-slate-100 p-5 sm:p-6 relative pb-20">
              {/* Top Speaker Notch (Matches demo photo) */}
              <div className="w-[92px] h-[7px] bg-[#e5e9f2] rounded-full mx-auto -mt-2 mb-4" />

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
        onClose={() => setShowAuthModal(false)}
        onSuccess={(loggedStudent) => {
          setStudent(loggedStudent);
          handleRefreshStudent();
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
    </div>
  );
}
