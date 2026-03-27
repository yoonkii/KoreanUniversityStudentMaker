'use client';

import { useRouter } from 'next/navigation';
import { useGameStore } from '@/store/gameStore';
import { useGameStore as useNewStore } from '@/stores/game-store';
import GlassPanel from '@/components/ui/GlassPanel';

interface PauseMenuProps {
  onClose: () => void;
}

export default function PauseMenu({ onClose }: PauseMenuProps) {
  const router = useRouter();
  const player = useGameStore((s) => s.player);
  const stats = useGameStore((s) => s.stats);
  const currentWeek = useGameStore((s) => s.currentWeek);
  const resetGame = useGameStore((s) => s.resetGame);
  const resetNewStore = useNewStore((s) => s.resetGame);

  // Try to get university from new store, fallback
  const university = useNewStore((s) => s.player.university) || '대학교';

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <GlassPanel variant="strong" className="p-6 animate-modal-enter">
          {/* Header */}
          <div className="text-center mb-5">
            <h2 className="text-lg font-bold text-txt-primary">일시정지</h2>
            <p className="text-xs text-txt-secondary mt-1">{university} · {player?.name ?? '학생'} · {currentWeek}주차</p>
          </div>

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-2 mb-5">
            {[
              { label: '준비도', value: stats.knowledge, color: stats.knowledge >= 60 ? 'text-teal' : 'text-coral' },
              { label: '체력', value: stats.health, color: stats.health >= 40 ? 'text-teal' : 'text-coral' },
              { label: '스트레스', value: stats.stress, color: stats.stress <= 50 ? 'text-teal' : 'text-coral' },
            ].map((s) => (
              <div key={s.label} className="text-center bg-white/5 rounded-lg py-2">
                <div className={`text-lg font-bold ${s.color}`}>{s.value}</div>
                <div className="text-[9px] text-txt-secondary/50">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-sm bg-teal/20 text-teal border border-teal/30 hover:bg-teal/30 transition-all cursor-pointer active:scale-[0.98]"
            >
              계속하기
            </button>
            <button
              onClick={() => router.push('/')}
              className="w-full py-2.5 rounded-xl text-sm text-txt-secondary hover:text-txt-primary bg-white/5 hover:bg-white/10 border border-white/10 transition-all cursor-pointer"
            >
              타이틀로 돌아가기
            </button>
            <button
              onClick={() => {
                if (confirm('정말 새 게임을 시작하시겠습니까? 현재 진행 상황이 초기화됩니다.')) {
                  resetGame();
                  resetNewStore();
                  router.push('/create');
                }
              }}
              className="w-full py-2.5 rounded-xl text-sm text-coral/60 hover:text-coral bg-white/[0.02] hover:bg-coral/5 border border-transparent hover:border-coral/20 transition-all cursor-pointer"
            >
              새 게임
            </button>
          </div>

          {/* Controls hint */}
          <p className="text-[9px] text-txt-secondary/30 text-center mt-4">
            ESC 또는 바깥을 탭하여 닫기
          </p>
        </GlassPanel>
      </div>
    </div>
  );
}
