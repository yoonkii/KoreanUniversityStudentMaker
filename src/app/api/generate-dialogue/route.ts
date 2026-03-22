import { NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

/** Validate that LLM output matches the expected dialogue response shape. */
function validateDialogueResponse(data: unknown): data is {
  dialogue: { text: string; expression?: string }[];
  choices: { id: string; text: string; statEffects: Record<string, number> }[];
} {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;

  if (!Array.isArray(obj.dialogue) || obj.dialogue.length === 0) return false;
  for (const line of obj.dialogue) {
    if (typeof line !== 'object' || line === null) return false;
    if (typeof (line as Record<string, unknown>).text !== 'string') return false;
  }

  if (!Array.isArray(obj.choices) || obj.choices.length === 0) return false;
  for (const choice of obj.choices) {
    if (typeof choice !== 'object' || choice === null) return false;
    const c = choice as Record<string, unknown>;
    if (typeof c.id !== 'string' || typeof c.text !== 'string') return false;
    if (typeof c.statEffects !== 'object' || c.statEffects === null) return false;
  }

  return true;
}

export async function POST(request: Request) {
  const rateLimitResponse = await checkRateLimit(request);
  if (rateLimitResponse) return rateLimitResponse;

  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  try {
    const { characterId, characterName, personality, context, playerStats, relationship } = body;

    const systemPrompt = `당신은 한국 대학교 생활 시뮬레이션 게임의 캐릭터입니다.

캐릭터 정보:
- 이름: ${String(characterName ?? '')}
- 성격: ${String(personality ?? '')}
- 플레이어와의 관계 친밀도: ${Number((relationship as Record<string, unknown>)?.affection ?? 50)}/100

게임 상태:
- 플레이어 스탯: ${JSON.stringify(playerStats ?? {})}

규칙:
1. 캐릭터의 성격에 맞는 자연스러운 한국어 대화를 생성하세요
2. 대화는 2-4줄로 짧게 유지하세요
3. 플레이어에게 2-3개의 선택지를 제공하세요
4. 각 선택지에는 스탯 변화를 포함하세요

반드시 아래 JSON 형식으로만 응답하세요 (JSON만 출력, 다른 텍스트 없이):
{
  "dialogue": [
    { "text": "대사 내용", "expression": "neutral" }
  ],
  "choices": [
    {
      "id": "choice_1",
      "text": "선택지 텍스트",
      "statEffects": { "social": 5, "stress": -3 },
      "relationshipEffects": [{ "characterId": "${String(characterId ?? '')}", "change": 5 }]
    }
  ]
}`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-5-20250929',
        max_tokens: 1024,
        system: systemPrompt,
        messages: [{ role: 'user', content: String(context ?? '대화를 시작해주세요') }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '';

    // Extract first complete JSON object (non-greedy match for balanced braces)
    const jsonMatch = text.match(/\{[\s\S]*?\}(?=[^}]*$)/) ?? text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
    }

    let result: unknown;
    try {
      result = JSON.parse(jsonMatch[0]);
    } catch {
      return NextResponse.json({ error: 'AI returned malformed JSON' }, { status: 502 });
    }

    if (!validateDialogueResponse(result)) {
      return NextResponse.json({ error: 'AI response failed schema validation' }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dialogue generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
