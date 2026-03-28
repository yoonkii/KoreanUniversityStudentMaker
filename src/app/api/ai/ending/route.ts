import { NextResponse } from "next/server";
import { generateText } from "../_shared/ai-client";
import type { PlayerStats } from "@/store/types";

const STAT_KEYS: (keyof PlayerStats)[] = ['knowledge', 'health', 'social', 'stress', 'charm', 'money'];
const STAT_KO: Record<string, string> = {
  knowledge: '준비도', health: '체력', social: '인맥', stress: '스트레스', charm: '매력', money: '돈',
};

interface EndingRequest {
  playerName: string;
  major: string;
  stats: PlayerStats;
  rollingSummary: string;
  romancePartner?: string;
  bestFriend?: string;
}

export async function POST(request: Request) {
  try {
    const body: EndingRequest = await request.json();

    const gradeFor = (val: number, key: string) => {
      if (key === 'money') return val >= 500000 ? 'A' : val >= 300000 ? 'B' : val >= 100000 ? 'C' : 'D';
      if (key === 'stress') return val <= 20 ? 'A' : val <= 40 ? 'B' : val <= 60 ? 'C' : 'D'; // Lower is better
      return val >= 80 ? 'A' : val >= 60 ? 'B' : val >= 40 ? 'C' : val >= 20 ? 'D' : 'F';
    };

    const statReport = STAT_KEYS.map(
      (k) => `${STAT_KO[k]}: ${Math.round(body.stats[k])} (${gradeFor(body.stats[k], k)})`
    ).join(', ');

    // Find identity stat (highest, excluding money and stress)
    const identityStats = STAT_KEYS.filter(k => k !== 'money' && k !== 'stress');
    const highestStat = identityStats.reduce((a, b) => body.stats[a] > body.stats[b] ? a : b);
    const lowestStat = identityStats.reduce((a, b) => body.stats[a] < body.stats[b] ? a : b);

    let relationshipContext = '';
    if (body.romancePartner) relationshipContext += `연인: ${body.romancePartner}\n`;
    if (body.bestFriend) relationshipContext += `베프: ${body.bestFriend}\n`;

    const systemPrompt = `당신은 한국 대학 생활 시뮬레이션의 엔딩 내레이터입니다.
감동적이고 진솔한 학기 회고를 써주세요.
플레이어의 선택과 희생을 모두 인정하면서, 성장과 대가를 균형 있게 보여주세요.
연인이나 베프가 있다면 그 관계가 학기에 어떤 의미였는지 꼭 언급하세요.
한국 대학생이 공감할 수 있는 현실적이고 따뜻한 문체로 쓰세요. 3-5문단.
JSON으로 응답: {"ending":"여기에 엔딩 텍스트"}`;

    const userPrompt = `학기 끝. ${body.playerName}, ${body.major}.

최종 스탯: ${statReport}
가장 높은 스탯 (정체성): ${STAT_KO[highestStat]}
가장 낮은 스탯 (희생): ${STAT_KO[lowestStat]}
${relationshipContext}
학기 요약:
${body.rollingSummary || '다양한 경험을 하며 한 학기를 보냈다.'}

이 학생의 한 학기를 돌아보는 엔딩 내레이션을 써주세요.`;

    const raw = await generateText({
      systemPrompt,
      userPrompt,
      thinkingLevel: 'medium',
    });

    // Extract JSON or use raw text
    let ending = raw;
    try {
      const parsed = JSON.parse(raw.replace(/```json?\s*/g, '').replace(/```/g, '').trim());
      ending = parsed.ending ?? raw;
    } catch {
      // Use raw text if not valid JSON
    }

    return NextResponse.json({ ending });
  } catch (error) {
    console.error('Ending generation error:', error);
    return NextResponse.json({
      ending: '한 학기가 끝났다. 돌아보면 많은 일이 있었고, 많이 성장했다. 이 캠퍼스에서의 시간은 영원히 기억에 남을 것이다.',
    });
  }
}
