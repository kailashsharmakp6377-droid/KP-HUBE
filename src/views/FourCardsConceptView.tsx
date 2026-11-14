import React, { useState } from 'react';
import { Play, Check, ShieldCheck, ArrowRight, Smartphone, Video, Clock } from 'lucide-react';
import type { Course, Lesson, Student } from '../types/index.ts';

interface FourCardsConceptViewProps {
  course: Course;
  lessons: Lesson[];
  student: Student | null;
  onOpenAuth: (prefillIdentifier?: string, mode?: 'login' | 'register') => void;
  onOpenPayment: () => void;
  onOpenCourse: () => void;
  onOpenLesson: (lesson: Lesson) => void;
}

export const FourCardsConceptView: React.FC<FourCardsConceptViewProps> = ({
  course,
  lessons,
  student,
  onOpenAuth,
  onOpenPayment,
  onOpenCourse,
  onOpenLesson
}) => {
  const [identifierInput, setIdentifierInput] = useState(student?.email || student?.phone || '');

  const completedCount = student ? student.completedLessonIds.length : 0;
  const totalCount = lessons.length || 14;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <div className="space-y-8 animate-fade-in py-2">
      {/* Top Concept Header (Matching Demo Image Exactly) */}
      <div className="text-center space-y-2">
        <p className="font-brand font-bold text-sm tracking-[0.25em] text-[#4f46e5] uppercase">
          KP HUBE • APP CONCEPT
        </p>
        <h1 className="font-brand font-bold text-2xl sm:text-3xl md:text-4xl text-[#14213d] tracking-tight">
          Your learning journey, in four simple steps
        </h1>
        <p className="text-sm sm:text-base text-[#62708b] max-w-xl mx-auto">
          Sign in with Gmail or Mobile + Password, enroll, and start learning instantly
        </p>
      </div>

      {/* 4 Cards Grid - Exact size (330px x 640px, rounded-[34px], shadow, notch) */}
      <div className="pb-8 pt-2">
        <div className="flex flex-wrap xl:flex-nowrap items-start justify-center gap-6 mx-auto px-2">
          
          {/* ================= CARD 1: SIGN IN ================= */}
          <div className="w-[330px] h-[640px] rounded-[34px] bg-white shadow-[0_14px_32px_rgba(35,49,91,0.14)] p-7 flex flex-col justify-between shrink-0 relative border border-slate-100 select-none">
            {/* Top Speaker Notch */}
            <div className="w-[92px] h-[7px] bg-[#e5e9f2] rounded-full mx-auto -mt-2 mb-3" />

            <div className="space-y-6">
              {/* Wordmark */}
              <span className="font-brand font-bold text-lg text-[#4f46e5] block">
                KP HUBE
              </span>

              {/* Title & Subtitle */}
              <div className="space-y-1.5 pt-4">
                <h2 className="font-brand font-bold text-[28px] text-[#14213d] leading-[1.15]">
                  Learn something<br />great today.
                </h2>
                <p className="text-[13px] text-[#66748c]">
                  Sign in with Gmail or Mobile & Password
                </p>
              </div>

              {/* Gmail or Mobile Input */}
              <div className="space-y-2 pt-4">
                <label className="block text-[13px] font-bold text-[#25324b]">
                  Gmail / Email or Mobile number
                </label>
                <div className="w-full h-[54px] rounded-[13px] bg-[#f7f8fc] border border-[#dfe4ef] px-4 flex items-center gap-2 text-[15px] text-[#8792a8]">
                  <input
                    type="text"
                    placeholder="you@gmail.com or 9876543210"
                    value={identifierInput}
                    onChange={(e) => setIdentifierInput(e.target.value)}
                    className="w-full bg-transparent text-[#14213d] placeholder:text-[#8792a8] focus:outline-none text-[14px]"
                  />
                </div>
              </div>

              {/* Continue Button */}
              <button
                onClick={() => onOpenAuth(identifierInput, 'login')}
                className="w-full h-[54px] rounded-[14px] bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] text-white font-bold text-[16px] shadow-md shadow-indigo-500/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                Sign In with Password
              </button>

              {/* Terms */}
              <div className="text-center text-[12px] text-[#8993a8] space-y-0.5">
                <p>New to KP HUBE?</p>
                <button
                  onClick={() => onOpenAuth(identifierInput, 'register')}
                  className="text-[#4f46e5] font-semibold hover:underline"
                >
                  Create Account in 10 Seconds
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="text-center text-[12px] text-[#9aa3b5] pb-1">
              No OTP needed • Saved automatically
            </div>
          </div>

          {/* ================= CARD 2: SAVED ACCOUNT ACCESS ================= */}
          <div className="w-[330px] h-[640px] rounded-[34px] bg-white shadow-[0_14px_32px_rgba(35,49,91,0.14)] p-7 flex flex-col justify-between shrink-0 relative border border-slate-100 select-none">
            {/* Top Speaker Notch */}
            <div className="w-[92px] h-[7px] bg-[#e5e9f2] rounded-full mx-auto -mt-2 mb-3" />

            <div className="space-y-5 text-center">
              {/* Wordmark */}
              <div className="text-left">
                <span className="font-brand font-bold text-lg text-[#4f46e5]">
                  KP HUBE
                </span>
              </div>

              {/* Icon Circle */}
              <div className="w-[84px] h-[84px] rounded-full bg-[#eef2ff] mx-auto flex items-center justify-center text-[#4f46e5] text-3xl">
                ✓
              </div>

              {/* Title & Subtitle */}
              <div className="space-y-1">
                <h2 className="font-brand font-bold text-[24px] text-[#14213d] leading-tight">
                  {student ? 'Account Saved!' : 'Instant ID & Password'}
                </h2>
                <p className="text-[13px] text-[#66748c]">
                  {student
                    ? 'Logged in and synced with KP HUBE'
                    : 'Use Gmail or Phone + Password — zero OTP delay'}
                </p>
                <p className="text-[13px] font-bold text-[#25324b] truncate px-2">
                  {student
                    ? student.email || (student.phone ? `+91 ${student.phone}` : student.name)
                    : 'rahul@gmail.com • ••••••••'}
                </p>
              </div>

              {/* Status summary box */}
              <div className="bg-[#f7f8fc] border border-[#dfe4ef] rounded-[14px] p-4 text-left space-y-2 text-[12px] text-[#52617a]">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#25324b]">Login Method</span>
                  <span className="text-[#059669] font-bold">Gmail / Phone</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-[#25324b]">Progress & Access</span>
                  <span className="text-[#4f46e5] font-bold">Saved Permanently</span>
                </div>
              </div>

              {/* Button */}
              <button
                onClick={() => (student ? onOpenCourse() : onOpenAuth(identifierInput, 'register'))}
                className="w-full h-[54px] rounded-[14px] bg-gradient-to-r from-[#4f46e5] to-[#06b6d4] text-white font-bold text-[16px] shadow-md shadow-indigo-500/20 hover:opacity-95 active:scale-[0.98] transition-all flex items-center justify-center"
              >
                {student ? 'Open My Course' : 'Create Free Account'}
              </button>
            </div>

            {/* Footer */}
            <div className="text-center text-[12px] text-[#9aa3b5] pb-1">
              Your account stays protected
            </div>
          </div>

          {/* ================= CARD 3: COURSE DETAILS / ENROLL ================= */}
          <div className="w-[330px] h-[640px] rounded-[34px] bg-white shadow-[0_14px_32px_rgba(35,49,91,0.14)] p-6 flex flex-col justify-between shrink-0 relative border border-slate-100 select-none">
            {/* Top Speaker Notch */}
            <div className="w-[92px] h-[7px] bg-[#e5e9f2] rounded-full mx-auto -mt-1 mb-2" />

            <div className="space-y-4">
              {/* Wordmark */}
              <span className="font-brand font-bold text-lg text-[#4f46e5] block">
                KP HUBE
              </span>

              {/* Headline */}
              <div>
                <h2 className="font-brand font-bold text-[22px] text-[#14213d] leading-tight">
                  Find your next course
                </h2>
                <p className="text-[13px] text-[#66748c]">
                  Learn at your pace, from anywhere
                </p>
              </div>

              {/* Featured Course Card with Play Button */}
              <div 
                onClick={onOpenPayment}
                className="w-full h-[145px] rounded-[18px] bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] p-5 text-white relative overflow-hidden shadow-sm cursor-pointer hover:opacity-95 transition-all"
              >
                {/* Big Translucent Play Button */}
                <div className="absolute right-4 top-1/2 -translate-y-1/2 w-24 h-24 rounded-full bg-white/20 flex items-center justify-center pointer-events-none">
                  <Play className="w-8 h-8 fill-white text-white ml-1" />
                </div>

                <div className="relative z-10 space-y-1 max-w-[170px]">
                  <div className="flex items-center gap-2 mb-1">
                    <img
                      src={course.bannerImage || '/assets/founder.jpg'}
                      alt="KP HUBE Founder"
                      className="w-7 h-7 rounded-full object-cover object-top border border-white/60 shadow-xs"
                      onError={(e) => {
                        e.currentTarget.src = '/assets/aistudio/WhatsApp_Image_2026-11-11_at_12.28.57_AM_c5373de0.jpeg';
                      }}
                    />
                    <span className="text-[10px] font-bold text-[#dff8ff] uppercase tracking-wider block">
                      {course.founderName}
                    </span>
                  </div>
                  <h3 className="font-brand font-bold text-[16px] leading-tight text-white line-clamp-2">
                    {course.title}
                  </h3>
                </div>
              </div>

              {/* Course Includes */}
              <div className="space-y-2 pt-1 text-[14px] text-[#52617a]">
                <h4 className="font-brand font-bold text-[16px] text-[#14213d]">
                  Course includes
                </h4>
                <div className="space-y-1.5 text-[13px]">
                  <p className="flex items-center gap-2">
                    <span className="text-[#059669] font-bold">✓</span>
                    <span>14 video lessons (Roman Hindi)</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#059669] font-bold">✓</span>
                    <span>Downloadable resources</span>
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="text-[#059669] font-bold">✓</span>
                    <span>Learn on any device</span>
                  </p>
                </div>
              </div>

              {/* Price */}
              <div className="pt-2">
                <span className="text-[11px] font-bold text-[#66748c] uppercase tracking-wider block">
                  ONE-TIME ENROLLMENT
                </span>
                <span className="font-brand font-extrabold text-[27px] text-[#14213d] block leading-tight">
                  ₹{course.price}
                </span>
              </div>
            </div>

            {/* Buy Button */}
            <button
              onClick={onOpenPayment}
              className="w-full h-[52px] rounded-[14px] bg-[#4f46e5] hover:bg-[#4338ca] text-white font-bold text-[15px] shadow-md shadow-indigo-600/20 active:scale-[0.98] transition-all flex items-center justify-center"
            >
              Buy course
            </button>
          </div>

          {/* ================= CARD 4: MY LEARNING / LESSONS ================= */}
          <div className="w-[330px] h-[640px] rounded-[34px] bg-white shadow-[0_14px_32px_rgba(35,49,91,0.14)] p-6 flex flex-col justify-between shrink-0 relative border border-slate-100 select-none">
            {/* Top Speaker Notch */}
            <div className="w-[92px] h-[7px] bg-[#e5e9f2] rounded-full mx-auto -mt-1 mb-2" />

            <div className="space-y-3">
              {/* Wordmark */}
              <span className="font-brand font-bold text-lg text-[#4f46e5] block">
                KP HUBE
              </span>

              {/* Title & Subtitle */}
              <div>
                <h2 className="font-brand font-bold text-[22px] text-[#14213d] leading-tight">
                  My learning
                </h2>
                <p className="text-[13px] text-[#66748c]">
                  Welcome back, learner
                </p>
              </div>

              {/* Continue Learning Banner */}
              <div 
                onClick={onOpenCourse}
                className="w-full h-[116px] rounded-[16px] bg-gradient-to-br from-[#4f46e5] to-[#06b6d4] p-4 text-white relative overflow-hidden shadow-sm cursor-pointer"
              >
                <div className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
                  <Play className="w-6 h-6 fill-white text-white ml-0.5" />
                </div>
                <div className="relative z-10 space-y-0.5 max-w-[180px]">
                  <span className="text-[10px] font-bold text-[#ddf7ff] uppercase tracking-wider block">
                    CONTINUE LEARNING
                  </span>
                  <h3 className="font-brand font-bold text-[15px] leading-tight text-white line-clamp-2">
                    {course.title}
                  </h3>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1 pt-1">
                <div className="w-full h-[8px] rounded-full bg-[#e9edf5] overflow-hidden">
                  <div
                    className="h-full bg-[#10b981] rounded-full transition-all"
                    style={{ width: `${Math.max(progressPercent, student ? 6 : 0)}%` }}
                  />
                </div>
                <p className="text-[11px] text-[#66748c]">
                  {completedCount} of {totalCount} lessons complete
                </p>
              </div>

              {/* Course Lessons Header */}
              <h4 className="font-brand font-bold text-[16px] text-[#14213d] pt-1">
                Course lessons
              </h4>

              {/* Lesson Items */}
              <div className="space-y-2">
                {lessons.slice(0, 3).map((lesson, idx) => {
                  const isCompleted = student ? student.completedLessonIds.includes(lesson.id) : false;
                  const isHighlight = idx === 1 && !isCompleted;
                  return (
                    <div
                      key={lesson.id}
                      onClick={() => onOpenLesson(lesson)}
                      className={`w-full h-[55px] rounded-[12px] px-3.5 flex items-center gap-3 cursor-pointer transition-colors ${
                        isHighlight
                          ? 'bg-[#eef2ff] hover:bg-indigo-100 border border-indigo-200/60'
                          : 'bg-[#f7f8fc] hover:bg-slate-100'
                      }`}
                    >
                      {isCompleted ? (
                        <div className="w-[30px] h-[30px] rounded-full bg-[#dff7ee] text-[#059669] flex items-center justify-center font-bold text-xs shrink-0">
                          ✓
                        </div>
                      ) : isHighlight ? (
                        <div className="w-[30px] h-[30px] rounded-full bg-[#4f46e5] text-white flex items-center justify-center shrink-0">
                          <Play className="w-3.5 h-3.5 fill-white text-white ml-0.5" />
                        </div>
                      ) : (
                        <div className="w-[30px] h-[30px] rounded-full bg-[#e9edf5] text-[#69768d] flex items-center justify-center font-bold text-xs shrink-0">
                          ▸
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-[12px] text-[#25324b] truncate">
                          {String(lesson.order).padStart(2, '0')}  {lesson.title}
                        </p>
                        <p className="text-[10px] text-[#8a95a8]">
                          {lesson.videoUrl ? 'Video Ready' : lesson.isFreePreview ? 'Free Preview' : 'Course Lesson'} • {lesson.durationMinutes}:00
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Bottom Nav Simulation */}
            <div className="w-full h-[36px] rounded-[12px] bg-[#f5f7fb] flex items-center justify-around px-2 text-[11px] font-bold text-[#66748c]">
              <span className="text-[#4f46e5]">Home</span>
              <span>My Courses</span>
              <span>Profile</span>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
