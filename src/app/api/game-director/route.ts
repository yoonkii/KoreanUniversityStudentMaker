import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: 'ANTHROPIC_API_KEY not configured' },
      { status: 500 }
    );
  }

  try {
    const { playerStats, relationships, currentWeek, tension, recentEvents } = await request.json();

    const systemPrompt = `당신은 한국 대학교 생활 시뮬레이션 게임의 Game Director AI입니다.

현재 상태:
- 주차: ${currentWeek}/16
- 긴장도: ${tension}/100
- 플레이어 스탯: ${JSON.stringify(playerStats)}
- 캐릭터 관계: ${JSON.stringify(relationships)}
- 최근 이벤트: ${recentEvents?.join(', ') || '없음'}

긴장도에 따른 이벤트 생성:
- 낮은 긴장도 (0-30): 일상적인 슬라이스 오브 라이프 이벤트
- 중간 긴장도 (31-60): 소소한 갈등이나 기회
- 높은 긴장도 (61-100): 중요한 드라마틱 이벤트

규칙:
1. 한국 대학 생활에 현실적인 이벤트를 생성하세요
2. 캐릭터의 관계도를 고려하세요
3. 이벤트는 의미 있는 선택을 포함해야 합니다

반드시 아래 JSON 형식으로만 응답하세요:
{
  "eventType": "academic|social|romance|crisis",
  "title": "이벤트 제목",
  "description": "이벤트 설명",
  "location": "classroom|library|cafe|dorm|club-room|campus|restaurant",
  "backgroundVariant": "daytime|quiet|counter|clean|normal|day",
  "characters": [
    { "characterId": "soyeon", "expression": "neutral", "position": "center" }
  ],
  "dialogue": [
    { "characterId": "soyeon", "text": "대사", "expression": "happy" }
  ],
  "choices": [
    {
      "id": "choice_1",
      "text": "선택지",
      "statEffects": { "social": 5 },
      "relationshipEffects": [{ "characterId": "soyeon", "change": 5 }]
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
        max_tokens: 800,
        system: systemPrompt,
        messages: [{ role: 'user', content: `${currentWeek}주차 이벤트를 생성해주세요. 긴장도: ${tension}` }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Game Director API error:', error);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '{}';

    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Game Director error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
