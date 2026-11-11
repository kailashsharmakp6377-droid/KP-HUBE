import React, { useState, useRef, useEffect } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, CheckCircle2, Lock, 
  FileText, Clock, AlertCircle, Sparkles, ChevronRight, Check
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { api } from '../services/api.ts';
import type { Lesson, Student, Course } from '../types/index.ts';

interface MyCourseScreenProps {
  course: Course;
  lessons: Lesson[];
  student: Student | null;
  onOpenPayment: () => void;
  selectedLessonId?: string;
  onRefreshStudent: () => void;
}

export const MyCourseScreen: React.FC<MyCourseScreenProps> = ({
  course,
  lessons,
  student,
  onOpenPayment,
  selectedLessonId,
  onRefreshStudent
}) => {
  const isEnrolled = student?.isEnrolled || false;
  
  // Select first available lesson or matching selectedLessonId
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(() => {
    if (selectedLessonId) {
      const match = lessons.find(l => l.id === selectedLessonId);
      if (match) return match;
    }
    return lessons[0] || null;
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1);
  const [updatingProgress, setUpdatingProgress] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (selectedLessonId) {
      const match = lessons.find(l => l.id === selectedLessonId);
      if (match) setActiveLesson(match);
    }
  }, [selectedLessonId, lessons]);

  // Handle speed change
  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  // Toggle lesson complete
  const handleToggleComplete = async (lessonId: string) => {
    if (!student) return;
    const isCompleted = student.completedLessonIds.includes(lessonId);
    setUpdatingProgress(true);
    try {
      await api.updateLessonProgress(lessonId, !isCompleted);
      if (!isCompleted) {
        confetti({ particleCount: 50, spread: 50, origin: { y: 0.7 } });
      }
      onRefreshStudent();
    } catch (err) {
      console.error('Failed to update progress', err);
    } finally {
      setUpdatingProgress(false);
    }
  };

  // Next / Previous Lesson
  const currentIndex = lessons.findIndex(l => l.id === activeLesson?.id);
  const prevLesson = currentIndex > 0 ? lessons[currentIndex - 1] : null;
  const nextLesson = currentIndex < lessons.length - 1 ? lessons[currentIndex + 1] : null;

  // Unenrolled locked paywall screen
  if (!isEnrolled && (!activeLesson || !activeLesson.isFreePreview)) {
    return (
      <div className="space-y-6 pb-24 animate-fade-in text-center max-w-lg mx-auto py-8">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 text-purple-700 flex items-center justify-center mx-auto shadow-sm">
          <Lock className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="font-brand font-black text-2xl text-slate-900">
            Course Lessons Locked
          </h2>
          <p className="text-xs text-slate-600 leading-relaxed max-w-sm mx-auto">
            Enrollment in the <strong>KP HUBE Complete YouTube Course</strong> is required to stream all 14 video lessons, access study PDFs, and track completion progress.
          </p>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 text-left space-y-3 shadow-sm">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-slate-700">Course Enrollment</span>
            <span className="font-bold text-purple-900">₹499 One-Time</span>
          </div>
          <div className="border-t border-slate-100 pt-2 space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Full Access to 14 Roman Hindi Lessons</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Mobile-First Player with Watermark Anti-Piracy</span>
            </div>
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Direct Creator Q&A & Support Roster</span>
            </div>
          </div>
        </div>

        <button
          onClick={onOpenPayment}
          className="w-full h-12 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm shadow-lg shadow-purple-700/25 flex items-center justify-center gap-2 active:scale-95 transition-all"
        >
          <span>Unlock All Lessons for ₹499</span>
          <ChevronRight className="w-4 h-4" />
        </button>

        {/* Free preview of Lesson 1 offer if available */}
        {lessons[0]?.isFreePreview && (
          <button
            onClick={() => setActiveLesson(lessons[0])}
            className="text-xs text-purple-700 font-semibold hover:underline block mx-auto"
          >
            Watch Free Preview: Lesson 01 ({lessons[0].title})
          </button>
        )}
      </div>
    );
  }

  const isCurrentLessonCompleted = student ? student.completedLessonIds.includes(activeLesson?.id || '') : false;
  const hasVideo = Boolean(activeLesson?.videoUrl);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      {/* 1. Video Player Container */}
      <div className="bg-slate-950 rounded-3xl overflow-hidden shadow-2xl border border-slate-900">
        <div className="relative aspect-video w-full bg-black flex items-center justify-center group">
          {hasVideo ? (
            activeLesson?.videoType === 'youtube' ? (
              <iframe
                src={`https://www.youtube-nocookie.com/embed/${getYouTubeId(activeLesson.videoUrl!)}?autoplay=0&rel=0`}
                title={activeLesson.title}
                className="w-full h-full border-0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                ref={videoRef}
                src={activeLesson?.videoUrl}
                controls
                className="w-full h-full object-contain"
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
              />
            )
          ) : (
            /* Honest "Awaiting Upload" placeholder state */
            <div className="p-6 text-center text-white space-y-3 max-w-sm mx-auto">
              <div className="w-12 h-12 rounded-2xl bg-purple-900/80 border border-purple-500/30 text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-bold tracking-widest text-amber-400 uppercase">
                  Lesson #{String(activeLesson?.order).padStart(2, '0')}
                </span>
                <h3 className="font-brand font-bold text-base">
                  {activeLesson?.title}
                </h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                Awaiting video upload by KP HUBE owner. The video stream will activate automatically as soon as the creator uploads the file in the admin dashboard.
              </p>
            </div>
          )}

          {/* Anti-Piracy Watermark Overlay (Floating Student Phone) */}
          {student && (
            <div className="absolute top-3 right-3 pointer-events-none select-none opacity-40 hover:opacity-10 text-[10px] font-mono text-white/90 bg-black/40 px-2 py-0.5 rounded backdrop-blur-xs">
              KP HUBE • +91 {student.phone}
            </div>
          )}
        </div>

        {/* Player Secondary Controls & Speed */}
        <div className="p-4 bg-slate-900 flex flex-wrap items-center justify-between gap-3 text-white border-t border-slate-800 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Speed:</span>
            {[0.75, 1, 1.25, 1.5, 2].map(speed => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium transition-colors ${
                  playbackSpeed === speed
                    ? 'bg-purple-600 text-white font-bold'
                    : 'text-slate-400 hover:text-white bg-slate-800'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            {activeLesson && (
              <button
                onClick={() => handleToggleComplete(activeLesson.id)}
                disabled={updatingProgress}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all ${
                  isCurrentLessonCompleted
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-200'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isCurrentLessonCompleted ? 'Completed' : 'Mark as Complete'}</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. Lesson Title & Navigation Bar */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-mono font-bold text-purple-700">
                Lesson {String(activeLesson?.order).padStart(2, '0')} of {lessons.length}
              </span>
              <span aria-hidden="true">·</span>
              <span>{activeLesson?.durationMinutes} mins</span>
              {activeLesson?.isFreePreview && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="text-emerald-700 font-bold">Free Preview</span>
                </>
              )}
            </div>
            <h2 className="font-brand font-bold text-xl text-slate-900">
              {activeLesson?.title}
            </h2>
            {activeLesson?.englishSubtitle && (
              <p className="text-xs text-slate-500 font-medium">
                {activeLesson.englishSubtitle}
              </p>
            )}
          </div>

          {/* Prev / Next Buttons */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => prevLesson && setActiveLesson(prevLesson)}
              disabled={!prevLesson}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition-colors"
            >
              <SkipBack className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>
            <button
              onClick={() => nextLesson && setActiveLesson(nextLesson)}
              disabled={!nextLesson}
              className="px-3.5 py-2 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-xs font-semibold disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shadow-sm transition-colors"
            >
              <span>Next</span>
              <SkipForward className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        <p className="text-xs text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
          {activeLesson?.description}
        </p>

        {activeLesson?.pdfUrl && (
          <div className="p-3 bg-purple-50/70 border border-purple-200/60 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-purple-900">
              <FileText className="w-4 h-4 text-purple-700" />
              <span>{activeLesson.pdfTitle || 'Lesson Resource & Notes PDF'}</span>
            </div>
            <a
              href={activeLesson.pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 bg-white hover:bg-purple-100 border border-purple-200 rounded-lg text-xs font-semibold text-purple-800 transition-colors"
            >
              Open PDF
            </a>
          </div>
        )}
      </div>

      {/* 3. Lesson Playlist Drawer */}
      <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200/80 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-brand font-bold text-base text-slate-900">All 14 Course Lessons</h3>
          <span className="text-xs text-slate-500 font-mono">
            {student ? student.completedLessonIds.length : 0} of {lessons.length} Completed
          </span>
        </div>

        <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
          {lessons.map((lesson) => {
            const isActive = lesson.id === activeLesson?.id;
            const isCompleted = student ? student.completedLessonIds.includes(lesson.id) : false;
            const isAwaiting = !lesson.videoUrl;

            return (
              <div
                key={lesson.id}
                onClick={() => setActiveLesson(lesson)}
                className={`p-3 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-3 ${
                  isActive
                    ? 'bg-purple-50 border-purple-300 shadow-xs'
                    : 'bg-white hover:bg-slate-50 border-slate-200/80'
                }`}
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleToggleComplete(lesson.id);
                    }}
                    className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 border transition-colors ${
                      isCompleted
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-slate-300 text-transparent hover:border-purple-600'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs text-slate-400">
                        {String(lesson.order).padStart(2, '0')}.
                      </span>
                      <p className={`text-xs font-semibold truncate ${isActive ? 'text-purple-900 font-bold' : 'text-slate-800'}`}>
                        {lesson.title}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-0.5">
                      <span>{lesson.durationMinutes}m</span>
                      {isAwaiting ? (
                        <span className="text-amber-700">· Awaiting upload</span>
                      ) : (
                        <span className="text-emerald-700">· Ready</span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  {isActive ? (
                    <span className="w-2 h-2 rounded-full bg-purple-700 block" />
                  ) : (
                    <Play className="w-3 h-3 text-slate-400" />
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

function getYouTubeId(url: string): string {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : url;
}
