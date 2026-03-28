import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";

/**
 * NPC Chat API — free-form conversation with NPCs via KakaoTalk.
 *
 * The player types anything and the NPC responds in-character.
 * This is the "next frontier" of AI in games — real conversations
 * with AI-driven characters, not canned dialogue trees.
 */

interface NpcChatRequest {
  npcId: string;
  playerMessage: string;
  playerName: string;
  // Context for the NPC to respond appropriately
  friendshipTier: string;
  romanceTier: string;
  playerStats: { knowledge: number; stress: number; charm: number };
  currentWeek: number;
  recentMemories?: string[];
}

const NPC_PERSONALITIES: Record<string, string> = {
  jaemin: `이재민 (재민). 20살 남자. 플레이어의 룸메이트.
성격: 밝고 긍정적, 말투가 편하고 장난기 많음. "야", "ㅋㅋ" 자주 씀.
사투리 없음. 게임과 치킨을 좋아함. 속으로는 불안한 면도 있음.
친한 친구에게는 진심을 보여주고, 로맨스 상대에게는 부끄러워함.`,

  minji: `한민지 (민지). 20살 여자. 같은 과 수석.
성격: 겉으로는 차갑고 말이 적음. "...응", "뭐" 같은 짧은 대답.
실은 인정 많고 경쟁심이 강함. 공부 얘기에 관심이 많음.
친해지면 조금씩 벽을 허묾. 로맨스 상대에게는 츤데레.`,

  soyeon: `박소연 (소연). 22살 여자. 같은 과 3학년 선배.
성격: 따뜻하고 챙겨주는 언니 같은 존재. "~요" 체 사용, 후배에게 반말 안 함.
요리와 카페를 좋아함. 졸업이 걱정이지만 후배 앞에서는 밝게 행동.
친한 후배에게는 본심을 보여줌. 로맨스 상대에게는 선배-후배 벽 고민.`,

  hyunwoo: `정현우 (현우). 22살 남자. 밴드 동아리 선배.
성격: 쿨하고 자유로운 영혼. 음악 이야기에 열정적.
"ㅎㅎ", "~지" 자주 씀. 기타와 작곡을 좋아함.
후배에게 편하게 대함. 로맨스 상대에게는 감성적인 면을 보여줌.`,
};

export async function POST(request: Request) {
  try {
    const body: NpcChatRequest = await request.json();
    const personality = NPC_PERSONALITIES[body.npcId];
    if (!personality) {
      return NextResponse.json({ reply: '...' });
    }

    const prompt = `당신은 한국 대학 생활 게임의 NPC입니다. 카카오톡으로 플레이어와 대화 중입니다.

캐릭터:
${personality}

현재 상황:
- ${body.currentWeek}주차 (16주 학기)
- 플레이어와의 관계: 우정 ${body.friendshipTier}, 사랑 ${body.romanceTier}
- 플레이어 스탯: 준비도 ${body.playerStats.knowledge}, 스트레스 ${body.playerStats.stress}, 매력 ${body.playerStats.charm}
${body.recentMemories?.length ? `- 최근 기억: ${body.recentMemories.join(', ')}` : ''}

플레이어 "${body.playerName}"이(가) 보낸 메시지:
"${body.playerMessage}"

이 캐릭터답게 카톡 답장을 써주세요. 규칙:
1. 1-3문장으로 짧게 (카톡이니까)
2. 이모지 가끔 사용 OK
3. 캐릭터의 말투와 성격을 반영
4. 관계 수준에 맞는 친밀도 (모르는 사이면 격식, 친구면 편하게, 연인이면 다정하게)
5. JSON으로 응답: {"reply":"답장 내용","mood":"happy/neutral/shy/worried/annoyed"}`;

    const raw = await generateText({
      userPrompt: prompt,
      thinkingLevel: 'minimal',
      maxRetries: 1,
    });

    let reply = raw;
    let mood = 'neutral';
    try {
      const parsed = JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
      reply = parsed.reply ?? raw;
      mood = parsed.mood ?? 'neutral';
    } catch {
      // Use raw text
    }

    return NextResponse.json({ reply, mood });
  } catch (error) {
    console.error('[npc-chat] Error:', error);
    return NextResponse.json({ reply: '...', mood: 'neutral' });
  }
}
