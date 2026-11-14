import React from 'react';
import { Lock, PlayCircle, Clock, FileText, CheckCircle, AlertCircle, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';
import type { Course, Lesson, Student } from '../types/index.ts';

interface CourseDetailsScreenProps {
  course: Course;
  lessons: Lesson[];
  student: Student | null;
  onOpenPayment: () => void;
  onOpenLesson: (lesson: Lesson) => void;
}

export const CourseDetailsScreen: React.FC<CourseDetailsScreenProps> = ({
  course,
  lessons,
  student,
  onOpenPayment,
  onOpenLesson
}) => {
  const isEnrolled = student?.isEnrolled || false;

  return (
    <div className="space-y-6 pb-28 animate-fade-in">
      {/* 1. Header Banner */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-col md:flex-row gap-6 items-start">
          {/* Course Thumbnail / Founder */}
          <div className="w-full md:w-56 aspect-[16/10] md:aspect-[3/4] rounded-2xl overflow-hidden bg-slate-900 shrink-0 relative shadow-md">
            <img
              src={course.bannerImage || '/assets/founder.jpg'}
              alt={course.title}
              className="w-full h-full object-cover object-top"
              onError={(e) => {
                e.currentTarget.src = '/assets/aistudio/WhatsApp_Image_2026-11-11_at_12.28.57_AM_c5373de0.jpeg';
              }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-purple-950/90 via-transparent to-transparent flex flex-col justify-end p-4 text-white">
              <span className="text-[10px] font-bold text-amber-300 uppercase tracking-widest">
                KP HUBE
              </span>
              <span className="font-brand font-bold text-sm leading-tight">
                Complete YouTube Course
              </span>
            </div>
          </div>

          {/* Course Details Info */}
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-purple-700">Official Course</span>
              <span aria-hidden="true">·</span>
              <span>{lessons.length || course.totalLessons} Video Episodes</span>
              <span aria-hidden="true">·</span>
              <span>{course.enrolledCount}+ Creators Enrolled</span>
            </div>

            <h1 className="font-brand font-black text-2xl sm:text-3xl text-slate-900 leading-tight">
              {course.title}
            </h1>

            <p className="text-sm text-slate-600 leading-relaxed">
              {course.description}
            </p>

            <div className="p-3.5 bg-purple-50/60 rounded-xl border border-purple-100 flex items-start gap-2.5 text-xs text-purple-900">
              <Sparkles className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                {course.announcement || 'Learn the exact systems, script frameworks, and YouTube algorithm strategies to turn video creation into a full-time career.'}
              </span>
            </div>

            <div className="flex items-baseline gap-3 pt-2">
              <span className="font-brand font-black text-3xl text-purple-900">
                ₹{course.price}
              </span>
              <span className="text-sm text-slate-400 line-through">
                ₹{course.originalPrice}
              </span>
              <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                One-Time Payment
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Honest Content Status Disclaimer */}
      <section className="bg-amber-50/80 rounded-2xl p-4 border border-amber-200/90 flex items-start gap-3 text-xs text-amber-900">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <span className="font-bold block">Transparent Course Delivery Notice</span>
          <p className="text-[11px] leading-relaxed text-amber-800">
            Lessons and materials are scheduled and uploaded directly by the course mentor in the admin dashboard. 
            Lessons awaiting video files are clearly marked as <strong>Awaiting Upload</strong> rather than showing fake playable clips. 
            All enrolled students receive immediate access as each lesson goes live.
          </p>
        </div>
      </section>

      {/* 3. Detailed Curriculum List */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div>
            <h2 className="font-brand font-bold text-xl text-slate-900">Course Episodes</h2>
            <p className="text-xs text-slate-500">
              Watch Episode 1 free preview to see what is inside this course
            </p>
          </div>
          <span className="text-xs font-semibold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-lg">
            {lessons.length} Episodes
          </span>
        </div>

        <div className="space-y-2.5">
          {lessons.map((lesson) => {
            const hasAccess = isEnrolled || lesson.isFreePreview;
            const isAwaiting = !lesson.videoUrl;

            return (
              <div
                key={lesson.id}
                onClick={() => {
                  if (hasAccess) {
                    onOpenLesson(lesson);
                  } else {
                    onOpenPayment();
                  }
                }}
                className={`p-4 rounded-2xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                  hasAccess
                    ? 'bg-white hover:bg-purple-50/30 border-slate-200'
                    : 'bg-slate-50/60 border-slate-100 opacity-80'
                }`}
              >
                <div className="flex items-start gap-3.5 flex-1">
                  {/* Order indicator */}
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-mono font-bold text-xs shrink-0 mt-0.5 ${
                    hasAccess
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-slate-200 text-slate-500'
                  }`}>
                    {String(lesson.order).padStart(2, '0')}
                  </div>

                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-bold text-sm text-slate-900">
                        {lesson.title}
                      </h3>
                      {lesson.isFreePreview && !isEnrolled && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          FREE PREVIEW
                        </span>
                      )}
                    </div>
                    
                    {lesson.englishSubtitle && (
                      <p className="text-xs text-slate-500 font-medium">
                        {lesson.englishSubtitle}
                      </p>
                    )}

                    {lesson.description && (
                      <p className="text-xs text-slate-600 line-clamp-1">
                        {lesson.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-slate-500 pt-1">
                      {lesson.durationMinutes > 0 && (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {lesson.durationMinutes} mins
                        </span>
                      )}
                      {isAwaiting ? (
                        <span className="text-amber-700 font-medium bg-amber-50 px-1.5 py-0.5 rounded text-[10px]">
                          Coming Soon • Video Upload Pending
                        </span>
                      ) : (
                        <span className="text-emerald-700 font-medium flex items-center gap-1 text-[10px]">
                          <PlayCircle className="w-3.5 h-3.5" /> Video Ready
                        </span>
                      )}
                      {lesson.pdfUrl && (
                        <span className="flex items-center gap-1 text-purple-700">
                          <FileText className="w-3.5 h-3.5" /> Study PDF
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action Affordance */}
                <div className="shrink-0 self-end sm:self-center">
                  {hasAccess ? (
                    <button
                      className="px-3.5 py-1.5 rounded-lg bg-purple-100 hover:bg-purple-200 text-purple-800 text-xs font-semibold flex items-center gap-1.5 transition-colors"
                    >
                      <PlayCircle className="w-3.5 h-3.5" />
                      <span>Watch</span>
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                      <Lock className="w-3.5 h-3.5 text-slate-400" />
                      <span>Locked</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 4. Sticky Bottom CTA Bar (Mobile Ergonomics) */}
      {!isEnrolled && (
        <div className="fixed bottom-16 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/95 to-transparent backdrop-blur-md border-t border-slate-200/80 z-30">
          <div className="max-w-md mx-auto flex items-center justify-between gap-4">
            <div>
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider block">
                Total Price
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-brand font-black text-2xl text-purple-900 leading-none">
                  ₹{course.price}
                </span>
                <span className="text-xs text-slate-400 line-through">
                  ₹{course.originalPrice}
                </span>
              </div>
            </div>

            <button
              onClick={onOpenPayment}
              className="flex-1 h-12 rounded-xl bg-purple-700 hover:bg-purple-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-purple-700/25 active:scale-95 transition-all"
            >
              <ShieldCheck className="w-4 h-4 text-amber-400" />
              <span>BUY NOW • ₹{course.price}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
