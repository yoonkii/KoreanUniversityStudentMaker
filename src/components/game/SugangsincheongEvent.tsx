'use client';

import { useState, useEffect, useCallback } from 'react';

interface CourseSlot {
  id: string;
  name: string;
  professor: string;
  seats: number;
  maxSeats: number;
  popular: boolean;
}

interface SugangsincheongEventProps {
  onComplete: (selectedCourseIds: string[]) => void;
}

const COURSE_POOL: CourseSlot[] = [
  { id: 'c1', name: '전공기초 I', professor: '김서영 교수', seats: 45, maxSeats: 50, popular: false },
  { id: 'c2', name: '심리학 개론', professor: '박지영 교수', seats: 3, maxSeats: 40, popular: true },
  { id: 'c3', name: '경제학원론', professor: '이성호 교수', seats: 28, maxSeats: 50, popular: false },
  { id: 'c4', name: '영어회화 A', professor: 'Sarah Johnson', seats: 1, maxSeats: 25, popular: true },
  { id: 'c5', name: '데이터분석 입문', professor: '정민수 교수', seats: 12, maxSeats: 30, popular: true },
  { id: 'c6', name: '창업과 혁신', professor: '최동현 교수', seats: 35, maxSeats: 40, popular: false },
  { id: 'c7', name: '한국사', professor: '김영수 교수', seats: 22, maxSeats: 50, popular: false },
  { id: 'c8', name: '프로그래밍 기초', professor: '이재훈 교수', seats: 5, maxSeats: 30, popular: true },
];

export default function SugangsincheongEvent({ onComplete }: SugangsincheongEventProps) {
  const [phase, setPhase] = useState<'countdown' | 'selecting' | 'done'>('countdown');
  const [countdown, setCountdown] = useState(5);
  const [courses, setCourses] = useState(COURSE_POOL.map(c => ({ ...c })));
  const [selected, setSelected] = useState<string[]>([]);
  const [serverCrashed, setServerCrashed] = useState(false);
  const [crashTimer, setCrashTimer] = useState(0);
  const [message, setMessage] = useState('');

  // Countdown phase
  useEffect(() => {
    if (phase !== 'countdown') return;
    if (countdown <= 0) {
      // 30% chance of server crash
      if (Math.random() < 0.3) {
        setServerCrashed(true);
        setMessage('⚠️ 서버 접속자가 폭주하여 일시적으로 접속이 불가합니다...');
        setCrashTimer(3);
      } else {
        setPhase('selecting');
        setMessage('수강신청이 시작되었습니다!');
      }
      return;
    }
    const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, phase]);

  // Server crash recovery
  useEffect(() => {
    if (!serverCrashed) return;
    if (crashTimer <= 0) {
      setServerCrashed(false);
      setPhase('selecting');
      setMessage('서버가 복구되었습니다! 빨리 신청하세요!');
      return;
    }
    const timer = setTimeout(() => setCrashTimer(t => t - 1), 1000);
    return () => clearTimeout(timer);
  }, [serverCrashed, crashTimer]);

  // Seats drain in real-time during selection
  useEffect(() => {
    if (phase !== 'selecting') return;
    const interval = setInterval(() => {
      setCourses(prev => prev.map(c => {
        if (selected.includes(c.id)) return c; // Don't drain courses you selected
        const drain = c.popular ? Math.ceil(Math.random() * 3) : (Math.random() < 0.3 ? 1 : 0);
        return { ...c, seats: Math.max(0, c.seats - drain) };
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, [phase, selected]);

  const handleSelect = useCallback((courseId: string) => {
    const course = courses.find(c => c.id === courseId);
    if (!course || course.seats <= 0) {
      setMessage('❌ 잔여석이 없습니다!');
      return;
    }
    if (selected.includes(courseId)) {
      setSelected(prev => prev.filter(id => id !== courseId));
      setMessage(`${course.name} 수강 취소`);
    } else if (selected.length >= 5) {
      setMessage('⚠️ 최대 5과목까지 신청 가능합니다');
    } else {
      setSelected(prev => [...prev, courseId]);
      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, seats: c.seats - 1 } : c
      ));
      setMessage(`✅ ${course.name} 수강 신청 완료!`);
    }
  }, [courses, selected]);

  const handleConfirm = () => {
    if (selected.length < 3) {
      setMessage('⚠️ 최소 3과목은 신청해야 합니다');
      return;
    }
    setPhase('done');
    setTimeout(() => onComplete(selected), 1500);
  };

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-[#1a1a2e] to-[#0a0a1a] flex flex-col items-center justify-center px-4">
      {/* Countdown phase */}
      {phase === 'countdown' && !serverCrashed && (
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white mb-2">🖥️ 수강신청 시스템</h1>
          <p className="text-gray-400 mb-8">접속 대기 중...</p>
          <div className="text-8xl font-bold text-teal animate-pulse">
            {countdown}
          </div>
          <p className="text-gray-500 text-sm mt-4">
            {Math.floor(Math.random() * 3000 + 5000)}명 동시 접속 중
          </p>
        </div>
      )}

      {/* Server crash */}
      {serverCrashed && (
        <div className="text-center animate-shake">
          <div className="text-6xl mb-4">💥</div>
          <h2 className="text-xl font-bold text-red-400 mb-2">{message}</h2>
          <div className="flex items-center justify-center gap-2 text-gray-400">
            <div className="animate-spin w-5 h-5 border-2 border-gray-400 border-t-transparent rounded-full" />
            <span>재접속 시도 중... ({crashTimer}초)</span>
          </div>
        </div>
      )}

      {/* Selection phase */}
      {phase === 'selecting' && (
        <div className="w-full max-w-lg">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white">과목 선택 ({selected.length}/5)</h2>
            <div className="text-xs text-red-400 animate-pulse">● LIVE</div>
          </div>

          {message && (
            <div className="mb-3 px-3 py-2 rounded-lg bg-white/10 text-sm text-white text-center">
              {message}
            </div>
          )}

          <div className="flex flex-col gap-2 mb-4">
            {courses.map(course => {
              const isSelected = selected.includes(course.id);
              const isFull = course.seats <= 0;
              const seatPercent = (course.seats / course.maxSeats) * 100;

              return (
                <button
                  key={course.id}
                  onClick={() => handleSelect(course.id)}
                  disabled={isFull && !isSelected}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    isSelected
                      ? 'border-teal bg-teal/10 text-white'
                      : isFull
                        ? 'border-red-500/30 bg-red-500/5 text-gray-500 cursor-not-allowed'
                        : 'border-white/10 bg-white/5 text-white hover:bg-white/10'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-medium text-sm">{course.name}</div>
                      <div className="text-xs text-gray-400">{course.professor}</div>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-mono ${
                        seatPercent < 10 ? 'text-red-400 animate-pulse font-bold' :
                        seatPercent < 30 ? 'text-orange-400' : 'text-green-400'
                      }`}>
                        {isFull ? '마감' : `${course.seats}/${course.maxSeats}`}
                      </div>
                      {isSelected && <div className="text-xs text-teal">✓ 신청됨</div>}
                    </div>
                  </div>
                  {/* Seat bar */}
                  <div className="mt-1.5 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        seatPercent < 10 ? 'bg-red-500' :
                        seatPercent < 30 ? 'bg-orange-400' : 'bg-green-500'
                      }`}
                      style={{ width: `${seatPercent}%` }}
                    />
                  </div>
                </button>
              );
            })}
          </div>

          <button
            onClick={handleConfirm}
            className="w-full py-3 bg-teal text-white rounded-xl font-bold hover:bg-teal/90 transition-all active:scale-[0.98]"
          >
            수강신청 확정 ({selected.length}과목)
          </button>
        </div>
      )}

      {/* Done */}
      {phase === 'done' && (
        <div className="text-center">
          <div className="text-6xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-white">수강신청 완료!</h2>
          <p className="text-gray-400 mt-2">{selected.length}과목 신청 성공</p>
        </div>
      )}

      <style jsx>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-10px); }
          40% { transform: translateX(10px); }
          60% { transform: translateX(-5px); }
          80% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.6s ease-in-out; }
      `}</style>
    </div>
  );
}
