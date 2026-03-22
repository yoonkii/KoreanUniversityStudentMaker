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
    const { characterId, characterName, personality, context, playerStats, relationship } = await request.json();

    const systemPrompt = `당신은 한국 대학교 생활 시뮬레이션 게임의 캐릭터입니다.

캐릭터 정보:
- 이름: ${characterName}
- 성격: ${personality}
- 플레이어와의 관계 친밀도: ${relationship?.affection ?? 50}/100

게임 상태:
- 플레이어 스탯: ${JSON.stringify(playerStats)}

규칙:
1. 캐릭터의 성격에 맞는 자연스러운 한국어 대화를 생성하세요
2. 대화는 2-4줄로 짧게 유지하세요
3. 플레이어에게 2-3개의 선택지를 제공하세요
4. 각 선택지에는 스탯 변화를 포함하세요

반드시 아래 JSON 형식으로만 응답하세요:
{
  "dialogue": [
    { "text": "대사 내용", "expression": "neutral" }
  ],
  "choices": [
    {
      "id": "choice_1",
      "text": "선택지 텍스트",
      "statEffects": { "social": 5, "stress": -3 },
      "relationshipEffects": [{ "characterId": "${characterId}", "change": 5 }]
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
        max_tokens: 500,
        system: systemPrompt,
        messages: [{ role: 'user', content: context }],
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('Anthropic API error:', error);
      return NextResponse.json({ error: 'AI generation failed' }, { status: 502 });
    }

    const data = await response.json();
    const text = data.content?.[0]?.text ?? '{}';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Invalid AI response format' }, { status: 502 });
    }

    const result = JSON.parse(jsonMatch[0]);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Dialogue generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
