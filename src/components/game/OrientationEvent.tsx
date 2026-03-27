'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useGameStore } from '@/store/gameStore';
import GlassPanel from '@/components/ui/GlassPanel';

interface OrientationEventProps {
  onComplete: () => void;
}

export default function OrientationEvent({ onComplete }: OrientationEventProps) {
  const [phase, setPhase] = useState<'intro' | 'meet1' | 'meet2' | 'meet3' | 'courses' | 'done'>('intro');
  const player = useGameStore((s) => s.player);
  const updateRelationship = useGameStore((s) => s.updateRelationship);
  const addEventHistory = useGameStore((s) => s.addEventHistory);

  const handleComplete = () => {
    // Initialize relationships from OT
    updateRelationship('jaemin', 5);
    updateRelationship('minji', 2);
    updateRelationship('hyunwoo', 3);
    updateRelationship('soyeon', 4);
    addEventHistory({ week: 1, summary: 'OT(오리엔테이션)에서 동기들을 만났다', choiceMade: '참석' });
    onComplete();
  };

  const NPC_PORTRAITS: Record<string, string> = {
    jaemin: '/assets/characters/jaemin/happy.png',
    minji: '/assets/characters/minji/neutral.png',
    soyeon: '/assets/characters/soyeon/happy.png',
    hyunwoo: '/assets/characters/hyunwoo/cool.png',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 overflow-y-auto py-4">
      <div className="w-full max-w-lg px-4">
        {phase === 'intro' && (
          <GlassPanel variant="strong" className="p-6 animate-modal-enter">
            <div className="text-center mb-4">
              <span className="text-5xl block mb-3">🎓</span>
              <h2 className="text-2xl font-bold text-txt-primary">신입생 오리엔테이션</h2>
              <p className="text-sm text-txt-secondary mt-2">학과 OT가 시작됐다. 강당에 같은 과 학생들이 모여 있다.</p>
            </div>
            <p className="text-sm text-txt-secondary/70 mb-4 leading-relaxed">
              학과장 교수님의 환영사가 끝나고, 자유롭게 어울리는 시간이 주어졌다.
              주변을 둘러보니 어색한 표정의 새내기들 사이에서 몇 명이 눈에 띈다.
            </p>
            <button onClick={() => setPhase('meet1')} className="w-full py-3 rounded-xl font-semibold bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 transition-all cursor-pointer active:scale-[0.98]">
              둘러보기
            </button>
          </GlassPanel>
        )}

        {phase === 'meet1' && (
          <GlassPanel variant="strong" className="p-6 animate-modal-enter">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-teal flex-shrink-0">
                <Image src={NPC_PORTRAITS.jaemin} alt="재민" width={64} height={64} className="object-cover object-top" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-txt-primary">이재민</h3>
                <p className="text-xs text-teal">같은 과 · 룸메이트</p>
                <p className="text-sm text-txt-secondary mt-2 leading-relaxed">
                  &ldquo;오 너 같은 방이지?! 나 재민이야! 반가워ㅋㅋ 아 나 '프로그래밍 기초' 들을 건데 너도 듣지? 같이 들으면 과제 할 때 편하잖아!&rdquo;
                </p>
              </div>
            </div>
            <p className="text-xs text-txt-secondary/50 mb-3 italic">밝고 에너지 넘치는 친구다. 벌써 편하게 말을 놓는다.</p>
            <button onClick={() => setPhase('meet2')} className="w-full py-2.5 rounded-xl text-sm bg-white/5 hover:bg-white/10 text-txt-primary border border-white/10 transition-all cursor-pointer">
              다음 →
            </button>
          </GlassPanel>
        )}

        {phase === 'meet2' && (
          <GlassPanel variant="strong" className="p-6 animate-modal-enter">
            <div className="flex items-start gap-4 mb-4">
              <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-coral flex-shrink-0">
                <Image src={NPC_PORTRAITS.minji} alt="민지" width={64} height={64} className="object-cover object-top" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-txt-primary">한민지</h3>
                <p className="text-xs text-coral">같은 과 · 입학 수석</p>
                <p className="text-sm text-txt-secondary mt-2 leading-relaxed">
                  &ldquo;...한민지야. 나 '전공기초 I'이랑 '데이터분석 입문' 들을 거야. 김서영 교수님 수업은 자리 빨리 차니까 수강신청 때 빨리 넣어.&rdquo;
                </p>
              </div>
            </div>
            <p className="text-xs text-txt-secondary/50 mb-3 italic">차가워 보이지만 유용한 정보를 알려줬다. 은근 친절한 건가?</p>
            <button onClick={() => setPhase('meet3')} className="w-full py-2.5 rounded-xl text-sm bg-white/5 hover:bg-white/10 text-txt-primary border border-white/10 transition-all cursor-pointer">
              다음 →
            </button>
          </GlassPanel>
        )}

        {phase === 'meet3' && (
          <GlassPanel variant="strong" className="p-6 animate-modal-enter">
            <div className="flex gap-4 mb-4">
              <div className="flex-1 flex items-start gap-3">
                <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-lavender flex-shrink-0">
                  <Image src={NPC_PORTRAITS.hyunwoo} alt="현우" width={48} height={48} className="object-cover object-top" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-txt-primary">정현우 <span className="text-xs text-lavender font-normal">3학년 · 밴드 동아리</span></h3>
                  <p className="text-xs text-txt-secondary mt-1">&ldquo;신입생? 반가워! 동아리 관심 있으면 찾아와~&rdquo;</p>
                </div>
              </div>
            </div>
            <div className="flex items-start gap-3 mb-4">
              <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-pink flex-shrink-0">
                <Image src={NPC_PORTRAITS.soyeon} alt="소연" width={48} height={48} className="object-cover object-top" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-txt-primary">박소연 <span className="text-xs text-pink font-normal">3학년 · 학과 멘토</span></h3>
                <p className="text-xs text-txt-secondary mt-1">&ldquo;후배들 많이 도와주고 싶어서 멘토 신청했어. 뭐든 물어봐!&rdquo;</p>
              </div>
            </div>
            <p className="text-xs text-txt-secondary/50 mb-3 italic">선배들이 따뜻하게 맞아줬다. 대학, 나쁘지 않은 것 같다.</p>
            <button onClick={() => setPhase('courses')} className="w-full py-2.5 rounded-xl text-sm bg-white/5 hover:bg-white/10 text-txt-primary border border-white/10 transition-all cursor-pointer">
              다음 →
            </button>
          </GlassPanel>
        )}

        {phase === 'courses' && (
          <GlassPanel variant="strong" className="p-6 animate-modal-enter">
            <h3 className="text-lg font-bold text-txt-primary mb-2">📋 수강 정보 공유</h3>
            <p className="text-sm text-txt-secondary mb-4">OT에서 들은 수강신청 팁들:</p>
            <div className="flex flex-col gap-2 mb-4">
              <div className="px-3 py-2 rounded-lg bg-teal/5 border border-teal/10 text-xs text-txt-secondary">
                <span className="text-teal font-bold">재민:</span> &ldquo;프로그래밍 기초 같이 듣자! 이재훈 교수님 꿀강이래.&rdquo;
              </div>
              <div className="px-3 py-2 rounded-lg bg-coral/5 border border-coral/10 text-xs text-txt-secondary">
                <span className="text-coral font-bold">민지:</span> &ldquo;김서영 교수님 전공기초 I은 빨리 마감될 거야. 9시 정각에 넣어.&rdquo;
              </div>
              <div className="px-3 py-2 rounded-lg bg-pink/5 border border-pink/10 text-xs text-txt-secondary">
                <span className="text-pink font-bold">소연 선배:</span> &ldquo;교양은 '심리학 개론' 추천! 학점도 잘 주고 재밌어.&rdquo;
              </div>
              <div className="px-3 py-2 rounded-lg bg-lavender/5 border border-lavender/10 text-xs text-txt-secondary">
                <span className="text-lavender font-bold">현우 선배:</span> &ldquo;'창업과 혁신' 들어봐. 교수님이 실무 경험 많으셔.&rdquo;
              </div>
            </div>
            <p className="text-xs text-txt-secondary/40 mb-3">💡 내일 아침 9시, 수강신청이 시작된다. 인기 과목은 금방 마감될 수 있다!</p>
            <button onClick={() => setPhase('done')} className="w-full py-3 rounded-xl font-semibold bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 transition-all cursor-pointer active:scale-[0.98]">
              수강신청 준비하기
            </button>
          </GlassPanel>
        )}

        {phase === 'done' && (
          <GlassPanel variant="strong" className="p-6 text-center animate-modal-enter">
            <span className="text-4xl block mb-3">🎉</span>
            <h2 className="text-xl font-bold text-txt-primary mb-2">OT 완료!</h2>
            <p className="text-sm text-txt-secondary mb-1">{player?.name ?? '학생'}의 대학 생활이 본격적으로 시작된다.</p>
            <p className="text-xs text-txt-secondary/50 mb-4">새로운 인연 4명을 만났다.</p>
            <div className="flex justify-center gap-3 mb-4">
              {Object.entries(NPC_PORTRAITS).map(([id, src]) => (
                <div key={id} className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                  <Image src={src} alt="" width={40} height={40} className="object-cover object-top" />
                </div>
              ))}
            </div>
            <button onClick={handleComplete} className="w-full py-3 rounded-xl font-semibold bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 transition-all cursor-pointer active:scale-[0.98]">
              수강신청 시작! →
            </button>
          </GlassPanel>
        )}
      </div>
    </div>
  );
}
