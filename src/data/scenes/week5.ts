import type { Scene } from '@/store/types';

/** Week 5: 수강 변경 기간 — Course change period. Rethink your semester direction. */
export const WEEK_5_SCENES: Scene[] = [
  {
    id: 'course_change',
    location: 'campus_cafe',
    backgroundVariant: 'busy',
    characters: [
      { characterId: 'soyeon', expression: 'neutral', position: 'left' },
      { characterId: 'jaemin', expression: 'neutral', position: 'right' },
    ],
    dialogue: [
      {
        characterId: null,
        text: '5주차. 수강 변경 기간이 왔다. 에브리타임에는 "이 수업 드랍할 사람?" 글이 넘쳐난다.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '야... 나 경제학원론 드랍할까 고민 중이야. 교수님이 너무 빡세...',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '수강 변경은 신중하게 해. 나도 1학년 때 쉬운 과목으로 바꿨다가 나중에 후회했어.',
      },
      {
        characterId: 'soyeon',
        expression: 'neutral',
        text: '지금 힘들어도 버티면 나중에 도움 되는 수업이 있고, 진짜 안 맞는 수업도 있거든.',
      },
      {
        characterId: 'jaemin',
        expression: 'neutral',
        text: '근데 이미 진도가 5주나 나갔는데... 새 수업 들어가면 따라갈 수 있을까?',
      },
      {
        characterId: null,
        text: '수강 변경 마감이 이틀 남았다. 지금의 선택이 남은 학기를 좌우할 수도 있다.',
      },
    ],
    choices: [
      {
        id: 'course_keep',
        text: '지금 수업 유지할게. 힘들어도 끝까지 해보는 게 맞아.',
        statEffects: { gpa: 3, stress: 5 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 5 },
          { characterId: 'jaemin', change: 2 },
        ],
      },
      {
        id: 'course_swap',
        text: '하나만 바꿔볼까. 교양으로 여유 좀 만들자.',
        statEffects: { stress: -8, gpa: -2, charm: 2 },
        relationshipEffects: [
          { characterId: 'soyeon', change: 1 },
          { characterId: 'jaemin', change: 4 },
        ],
      },
      {
        id: 'course_help_jaemin',
        text: '재민아, 내가 경제학 노트 공유해줄게. 같이 버텨보자.',
        statEffects: { social: 4, gpa: 1, stress: 3 },
        relationshipEffects: [
          { characterId: 'jaemin', change: 8 },
          { characterId: 'soyeon', change: 3 },
        ],
      },
    ],
  },
];
