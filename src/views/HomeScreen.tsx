import React from 'react';
import { Play, CheckCircle2, Sparkles, ShieldCheck, ArrowRight, Crown } from 'lucide-react';
import type { Course, Lesson, Student } from '../types/index.ts';

interface HomeScreenProps {
  course: Course;
  courses?: Course[];
  lessons: Lesson[];
  student: Student | null;
  onViewCourse: (courseId?: string) => void;
  onGoToMyCourse: (courseId?: string) => void;
  onOpenLesson: (lesson: Lesson) => void;
  onOpenPayment: (courseId?: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  course,
  courses,
  lessons,
  student,
  onViewCourse,
  onGoToMyCourse,
  onOpenLesson,
  onOpenPayment
}) => {
  const allCourses = courses && courses.length > 0 ? courses : [course];
  const vipCourse = allCourses.find(c => c.isMain) || allCourses[0];
  const otherCourses = allCourses.filter(c => c.id !== vipCourse.id);

  const isCourseUnlocked = (cId: string): boolean => {
    if (!student) return false;
    if (Array.isArray(student.enrolledCourseIds) && student.enrolledCourseIds.length > 0) {
      return student.enrolledCourseIds.includes(cId);
    }
    return Boolean(student.isEnrolled && cId === 'course-yt-01');
  };

  const getCourseLessons = (cId: string) =>
    lessons.filter(l => (l.courseId || 'course-yt-01') === cId);

  const vipLessons = getCourseLessons(vipCourse.id);
  const vipLessonCount = vipLessons.length || vipCourse.totalLessons || 5;
  const vipUnlocked = isCourseUnlocked(vipCourse.id);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      {/* 1. Welcome & Brand Hero Section */}
      <section className="bg-gradient-to-b from-purple-900 via-purple-900 to-purple-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 justify-between">
          <div className="space-y-3 text-center md:text-left flex-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-amber-400 bg-purple-800/80 border border-purple-700/60 px-3 py-1 rounded-full">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Official YouTube Creator Academy</span>
            </div>

            <h1 className="font-brand font-black text-2xl sm:text-3xl md:text-4xl tracking-tight leading-tight text-white">
              LEARN • GROW • SUCCEED
            </h1>

            <p className="text-sm text-purple-100 max-w-lg leading-relaxed">
              Welcome to <span className="font-bold text-amber-300">KP HUBE</span>.
              Choose our flagship <strong className="text-amber-300">VIP Course</strong> (15 Episodes • ₹{vipCourse.price}) or start instantly with our <strong className="text-white">₹{otherCourses[0]?.price || 49} Starter Course</strong> ({otherCourses[0]?.totalLessons || 5} Episodes).
            </p>

            <div className="pt-2 flex flex-wrap items-center justify-center md:justify-start gap-3">
              {vipUnlocked ? (
                <button
                  onClick={() => onGoToMyCourse(vipCourse.id)}
                  className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 active:scale-95 transition-all"
                >
                  <Play className="w-4 h-4 fill-current" />
                  <span>Open VIP Course</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onViewCourse(vipCourse.id)}
                    className="px-6 py-3 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-sm rounded-xl shadow-lg shadow-amber-400/20 flex items-center gap-2 active:scale-95 transition-all"
                  >
                    <Crown className="w-4 h-4" />
                    <span>VIEW VIP COURSE</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => onOpenPayment(vipCourse.id)}
                    className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white font-semibold text-sm rounded-xl border border-white/20 flex items-center gap-1.5 transition-all"
                  >
                    <span>Join VIP • ₹{vipCourse.price}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Founder Portrait Card */}
          <div className="shrink-0 w-44 sm:w-52 bg-white rounded-2xl p-2.5 shadow-2xl border border-purple-200/40 text-slate-900 text-center">
            <div className="relative aspect-[3/4] w-full rounded-xl overflow-hidden bg-white border border-slate-100">
              <img
                src={vipCourse.bannerImage || '/assets/founder.jpg'}
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
                  {vipCourse.founderName}
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

      {/* 2. MAIN COURSE: VIP Course Highlight Card */}
      <section className="bg-gradient-to-br from-slate-950 via-purple-950 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-amber-400/30">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="inline-flex items-center gap-1.5 font-extrabold text-purple-950 bg-amber-400 px-2.5 py-0.5 rounded-full text-[11px]">
                <Crown className="w-3.5 h-3.5" />
                <span>{vipCourse.badge || 'VIP MAIN COURSE'}</span>
              </span>
              <span className="text-purple-200">{vipLessonCount} Video Episodes</span>
              <span aria-hidden="true" className="text-purple-400">·</span>
              <span className="text-purple-200">Full Lifetime Access</span>
            </div>

            <h2 className="font-brand font-extrabold text-2xl text-white leading-tight">
              {vipCourse.title}
            </h2>

            <p className="text-sm text-purple-100/90 leading-relaxed max-w-2xl">
              {vipCourse.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
              {vipCourse.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs text-purple-100">
                  <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Box & CTA */}
          <div className="w-full md:w-64 bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/15 flex flex-col justify-between shrink-0 space-y-4">
            <div>
              <span className="text-[11px] font-semibold text-amber-300 uppercase tracking-wider block">
                Main VIP Program
              </span>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="font-brand font-black text-3xl text-white">
                  ₹{vipCourse.price}
                </span>
                <span className="text-sm text-purple-300 line-through">
                  ₹{vipCourse.originalPrice}
                </span>
                <span className="text-[10px] font-bold text-purple-950 bg-amber-300 px-2 py-0.5 rounded-md">
                  {vipCourse.originalPrice > vipCourse.price
                    ? `${Math.round((1 - vipCourse.price / vipCourse.originalPrice) * 100)}% OFF`
                    : 'VIP'}
                </span>
              </div>
              <p className="text-[11px] text-purple-200 mt-1">
                One-time payment. Lifetime VIP access & future updates.
              </p>
            </div>

            <div className="space-y-2">
              {vipUnlocked ? (
                <button
                  onClick={() => onGoToMyCourse(vipCourse.id)}
                  className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 transition-all"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>OPEN VIP COURSE</span>
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onOpenPayment(vipCourse.id)}
                    className="w-full h-11 bg-amber-400 hover:bg-amber-300 text-purple-950 font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>JOIN VIP COURSE • ₹{vipCourse.price}</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => onViewCourse(vipCourse.id)}
                    className="w-full py-2 text-[11px] font-semibold text-purple-100 hover:text-amber-300 transition-colors"
                  >
                    See VIP Episodes & Details →
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Starter Creator Course */}
      {otherCourses.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <h3 className="font-brand font-bold text-lg text-slate-900">
                Starter YouTube Course
              </h3>
              <p className="text-xs text-slate-500">
                Beginner-friendly 5-episode starter batch — just ₹{otherCourses[0]?.price || 49} one-time
              </p>
            </div>
          </div>

          <div className={`grid gap-4 ${otherCourses.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
            {otherCourses.map((c) => {
              const cLessons = getCourseLessons(c.id);
              const cCount = cLessons.length || c.totalLessons || 5;
              const unlocked = isCourseUnlocked(c.id);

              return (
                <div
                  key={c.id}
                  className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-slate-200/80 flex flex-col justify-between gap-4 hover:border-purple-200 transition-all"
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <span className="font-bold text-purple-700 bg-purple-50 border border-purple-100 px-2.5 py-0.5 rounded-full text-[11px]">
                        {c.badge || `₹${c.price} COURSE`}
                      </span>
                      <span className="text-slate-500 font-medium">{cCount} Episodes</span>
                    </div>

                    <h4 className="font-brand font-extrabold text-lg text-slate-900 leading-snug">
                      {c.title}
                    </h4>

                    <p className="text-xs text-slate-600 leading-relaxed">
                      {c.description}
                    </p>

                    <div className="space-y-1.5 pt-1">
                      {c.features.slice(0, 4).map((feature, idx) => (
                        <div key={idx} className="flex items-center gap-2 text-xs text-slate-700">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feature}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                    <div>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-brand font-black text-2xl text-purple-900">
                          ₹{c.price}
                        </span>
                        <span className="text-xs text-slate-400 line-through">
                          ₹{c.originalPrice}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-500 block">Lifetime Access</span>
                    </div>

                    {unlocked ? (
                      <button
                        onClick={() => onGoToMyCourse(c.id)}
                        className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-sm transition-all"
                      >
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>OPEN COURSE</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => onViewCourse(c.id)}
                          className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-colors"
                        >
                          Details
                        </button>
                        <button
                          onClick={() => onOpenPayment(c.id)}
                          className="px-4 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold text-xs rounded-xl shadow-md shadow-purple-700/20 flex items-center gap-1 active:scale-95 transition-all"
                        >
                          <span>Buy ₹{c.price}</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* 4. Episodes Overview Strip (Main VIP Course Preview) */}
      <section className="bg-white rounded-3xl p-6 shadow-sm border border-slate-200/80 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-brand font-bold text-lg text-slate-900">VIP Course Episodes at a Glance</h3>
            <p className="text-xs text-slate-500">
              {vipLessonCount} episodes • Watch Episode 1 free preview now
            </p>
          </div>
          <button
            onClick={() => onViewCourse(vipCourse.id)}
            className="text-xs font-semibold text-purple-700 hover:text-purple-900 flex items-center gap-1"
          >
            <span>See All {vipLessonCount} Episodes</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          {vipLessons.slice(0, 6).map((lesson) => (
            <div
              key={lesson.id}
              onClick={() => (lesson.isFreePreview ? onOpenLesson(lesson) : onViewCourse(vipCourse.id))}
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

      {/* 5. Creator Trust & Verification Note */}
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
