import React from 'react';
import { Play, CheckCircle2, Sparkles, BookOpen, Clock, ShieldCheck, ArrowRight, Video } from 'lucide-react';
import type { Course, Lesson, Student } from '../types/index.ts';

interface HomeScreenProps {
  course: Course;
  lessons: Lesson[];
  student: Student | null;
  onViewCourse: () => void;
  onGoToMyCourse: () => void;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenPayment: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  course,
  lessons,
  student,
  onViewCourse,
  onGoToMyCourse,
  onOpenLesson,
  onOpenPayment
}) => {
  const isEnrolled = student?.isEnrolled || false;
  const totalCount = lessons.length || course.totalLessons || 5;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* 1. Welcome & Brand Hero Section */}
      <section className="bg-gradient-to-b from-purple-900 via-purple-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Subtle decorative background glow */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between">
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-purple-800/80 border border-purple-700/60 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official YouTube Creator Program</span>
            </div>
            
            <h1 className="font-brand font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight text-white">
              {course.tagline}
            </h1>
            
            <p className="text-sm text-purple-100 max-w-lg leading-relaxed">
              Welcome to <span className="font-bold text-amber-300">KP HUBE</span>.
              Zero confusion, practical YouTube growth roadmap tailored for ambitious Indian creators.
              Learn how to build, scale, and monetize your channel from scratch.
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {isEnrolled ? (
                <button
                  onClick={onGoToMyCourse}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Continue Learning</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={onViewCourse}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <span>VIEW COURSE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={onOpenPayment}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 flex items-center gap-1.5 transition-all"
                  >
                    <span>Enroll for ₹{course.price}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Founder Portrait Card */}
          <div className="shrink-0 w-44 sm:w-52 bg-white rounded-2xl p-2.5 shadow-2xl border border-purple-200/40 text-slate-900 text-center">
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-white border border-slate-100">
              <img
                src={course.bannerImage || '/assets/founder.jpg'}
                alt="KP HUBE Founder wearing black hoodie"
                className="w-full h-full object-cover object-top"
                onError={(e) => {
                  e.currentTarget.src = '/assets/aistudio/WhatsApp_Image_2026-11-11_at_12.28.57_AM_c5373de0.jpeg';
                }}
              />
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-2 text-white text-left">
                <span className="block text-[10px] font-bold tracking-wider text-amber-300 uppercase">
                  Creator & Mentor
                </span>
                <span className="font-brand font-bold text-xs">
                  {course.founderName}
                </span>
              </div>
            </div>
            <div className="mt-2 text-left px-1">
              <p className="text-[10px] text-slate-500 leading-tight">
                Specialist in YouTube channel growth & algorithm mechanics.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Single Course Card (Requirement: Show one course only) */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex items-center gap-2 text-xs text-slate-500">
              <span className="font-semibold text-purple-700">Signature Course</span>
              <span aria-hidden="true">·</span>
              <span>{totalCount} Video Episodes</span>
              <span aria-hidden="true">·</span>
              <span>Full Lifetime Access</span>
            </div>

            <h2 className="font-brand font-extrabold text-2xl text-slate-900 leading-tight">
              {course.title}
            </h2>

            <p className="text-sm text-slate-600 leading-relaxed max-w-2xl">
              {course.description}
            </p>

            {/* Curriculum Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {course.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Box & CTA */}
          <div className="w-full md:w-64 bg-purple-50/60 rounded-2xl p-5 border border-purple-100 flex flex-col justify-between shrink-0 space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-purple-900 uppercase tracking-wider block">
                One-Time Course Fee
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-brand font-black text-3xl text-purple-900">
                  ₹{course.price}
                </span>
                <span className="text-sm text-slate-400 line-through">
                  ₹{course.originalPrice}
                </span>
                <span className="text-xs font-bold text-amber-700 bg-amber-100/80 px-2 py-0.5 rounded-md">
                  75% OFF
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                No monthly recurring fees. Instant access to lessons & materials.
              </p>
            </div>

            {isEnrolled ? (
              <button
                onClick={onGoToMyCourse}
                className="w-full h-11 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 flex items-center justify-center gap-1.5 transition-all"
              >
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>OPEN MY COURSE</span>
              </button>
            ) : (
              <button
                onClick={onViewCourse}
                className="w-full h-11 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 flex items-center justify-center gap-1.5 active:scale-95 transition-all"
              >
                <span>VIEW COURSE</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 3. Episodes Overview Strip */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-brand font-bold text-lg text-slate-900">Course Episodes at a Glance</h3>
            <p className="text-xs text-slate-500">
              {totalCount} episodes • Watch Episode 1 free preview now
            </p>
          </div>
          <button
            onClick={onViewCourse}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            <span>See All {totalCount} Episodes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {lessons.slice(0, 6).map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => (lesson.isFreePreview ? onOpenLesson(lesson) : onViewCourse())}
              className="p-3.5 rounded-xl border border-slate-100 bg-slate-50/50 hover:bg-purple-50/40 hover:border-purple-200 cursor-pointer transition-all flex items-center justify-between gap-2.5"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-mono font-bold text-xs text-purple-700 bg-purple-100 w-7 h-7 rounded-lg flex items-center justify-center shrink-0">
                  {String(lesson.order).padStart(2, '0')}
                </span>
                <span className="text-xs font-semibold text-slate-800 line-clamp-1">
                  {lesson.title}
                </span>
              </div>
              {lesson.isFreePreview && (
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full shrink-0">
                  FREE
                </span>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* 4. Creator Trust & Verification Note */}
      <section className="bg-slate-100/70 rounded-2xl p-4 border border-slate-200/80 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-600 space-y-0.5">
          <span className="font-bold text-slate-800 block">Verified KP HUBE Quality & Transparency</span>
          <p className="text-[11px] leading-relaxed">
            All course payments are verified through official India payment channels. No fake videos or fake Play buttons. Enrolled students receive direct updates as new materials and video streams are scheduled.
          </p>
        </div>
      </section>
    </div>
  );
};
