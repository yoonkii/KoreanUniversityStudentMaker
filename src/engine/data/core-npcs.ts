import type { NPCCharacterSheet } from "../types/npc";

/**
 * 8 core NPCs — each designed to create different kinds of emergent drama.
 * Their personalities are specifically tuned so that their interactions with
 * each other and the player create natural tension points.
 */
export const CORE_NPC_SHEETS: NPCCharacterSheet[] = [
  // ─── ROOMMATE ───────────────────────────────────────
  {
    id: "npc_minsu",
    name: "김민수",
    role: "roommate",
    personality: {
      openness: 70,
      conscientiousness: 35,
      extraversion: 80,
      agreeableness: 65,
      neuroticism: 40,
    },
    values: ["우정", "자유", "즐거움"],
    speechPattern:
      "반말, 느낌표 많이 씀, 텐션 높음, 슬랭 자주 사용. '야 진짜', 'ㄹㅇ', '미쳤다' 등.",
    backstory:
      "서울 출신. 재수 끝에 겨우 합격해서 대학 생활을 200% 즐기겠다고 다짐. 공부보다는 사람들과 어울리는 걸 좋아하고, 룸메이트인 플레이어에게 끊임없이 놀자고 한다.",
    quirks: [
      "밤에 라면 끓이면서 인생 상담",
      "시험 전날에야 벼락치기",
      "모르는 사람한테도 먼저 말 건다",
    ],
    goals: ["동아리 회장 되기", "여자친구 만들기", "학점은 최소한만"],
    appearancePrompt:
      "Korean male university student, messy dark brown hair, bright friendly smile, casual hoodie and jeans, slightly tall, energetic posture",
    major: "경영학과",
    year: 2,
    sharedCourseIds: [],
    primaryLocationIds: ["dorm", "club_room", "campus_outdoor", "cafe"],
  },

  // ─── SAME-MAJOR CLASSMATE ──────────────────────────
  {
    id: "npc_jiwon",
    name: "이지원",
    role: "classmate",
    personality: {
      openness: 55,
      conscientiousness: 85,
      extraversion: 40,
      agreeableness: 50,
      neuroticism: 60,
    },
    values: ["성적", "인정", "완벽"],
    speechPattern:
      "존댓말과 반말 섞어 씀, 정확한 표현, 가끔 날카로운 말, 쓸데없는 말 안 함.",
    backstory:
      "수시 1등급으로 입학한 모범생. 겉으로는 차갑지만 인정받고 싶은 욕구가 강하다. 플레이어를 조용히 라이벌로 의식하면서도, 같이 공부하자고 먼저 말하는 타입.",
    quirks: [
      "필기 완벽주의",
      "조별과제에서 결국 다 혼자 함",
      "카페에서만 공부하고 도서관 싫어함",
    ],
    goals: ["전액 장학금", "교수님 연구실 들어가기", "학점 4.3 사수"],
    appearancePrompt:
      "Korean female university student, neat shoulder-length black hair with clips, serious but pretty face, glasses, neat cardigan over collared shirt, carrying organized notes",
    major: "동일학과",
    year: 2,
    sharedCourseIds: [],
    primaryLocationIds: ["classroom", "library", "cafe"],
  },

  // ─── SENIOR (선배) ──────────────────────────────────
  {
    id: "npc_hyunwoo",
    name: "박현우",
    role: "senior",
    personality: {
      openness: 60,
      conscientiousness: 55,
      extraversion: 65,
      agreeableness: 75,
      neuroticism: 30,
    },
    values: ["후배 챙기기", "경험", "여유"],
    speechPattern:
      "부드러운 말투, 조언해주는 느낌, 가끔 아재 개그, '그때 나도 그랬어' 자주 말함.",
    backstory:
      "4학년 졸업반. 취업 스트레스를 겪으면서도 후배들한테는 여유 있는 척한다. 플레이어의 멘토 역할을 자처하지만, 사실 본인도 불안하다.",
    quirks: [
      "후배한테 밥 사주는 게 습관",
      "취업 이야기 나오면 표정 굳음",
      "캠퍼스 벤치에서 혼자 멍때리기",
    ],
    goals: ["취업 성공", "후배들한테 좋은 선배로 기억되기", "졸업 전 연애"],
    appearancePrompt:
      "Korean male university student, 4th year, slightly tired but kind eyes, neat short black hair, wearing a polo shirt, mature and reliable appearance",
    major: "동일학과",
    year: 4,
    sharedCourseIds: [],
    primaryLocationIds: ["campus_outdoor", "cafe", "library"],
  },

  // ─── PROFESSOR ──────────────────────────────────────
  {
    id: "npc_prof_kim",
    name: "김서영 교수",
    role: "professor",
    personality: {
      openness: 80,
      conscientiousness: 90,
      extraversion: 45,
      agreeableness: 40,
      neuroticism: 25,
    },
    values: ["학문", "정직", "노력"],
    speechPattern:
      "존댓말, 학술적 표현, 짧고 핵심적, 칭찬에 인색하지만 노력하는 학생에겐 따뜻.",
    backstory:
      "해외 박사 출신의 젊은 교수. 엄격하지만 공정하다. 학생들이 무서워하지만, 연구실에서 1:1로 만나면 의외로 인간적이다. 잠재력 있는 학생을 발견하면 기회를 준다.",
    quirks: [
      "출석 체크 칼같음",
      "리포트 피드백이 빨간펜으로 빼곡",
      "가끔 수업 중 본인 유학 시절 이야기",
    ],
    goals: ["좋은 논문 발표", "유망한 제자 발견", "연구 펀딩 확보"],
    appearancePrompt:
      "Korean female professor, early 40s but youthful, sharp intelligent eyes, professional blazer, hair in a neat bun, holding a red pen, confident posture",
    major: "동일학과",
    year: 0,
    sharedCourseIds: [],
    primaryLocationIds: ["classroom"],
  },

  // ─── PART-TIME WORK COLLEAGUE ──────────────────────
  {
    id: "npc_soyeon",
    name: "한소연",
    role: "work_colleague",
    personality: {
      openness: 45,
      conscientiousness: 70,
      extraversion: 55,
      agreeableness: 80,
      neuroticism: 65,
    },
    values: ["가족", "생존", "성실"],
    speechPattern:
      "다정한 말투, 가끔 한숨, 현실적인 조언, '그래도 버텨야지' 같은 말 자주 함.",
    backstory:
      "학비와 생활비를 전부 스스로 벌어야 하는 자취생. 편의점 알바를 같이 하면서 플레이어와 친해진다. 밝게 웃지만 혼자 있을 때 지쳐 보인다. 꿈은 있지만 당장의 생존이 먼저.",
    quirks: [
      "알바 중에 몰래 교재 읽음",
      "유통기한 임박 도시락 챙겨줌",
      "새벽 퇴근 후 편의점 앞에서 하늘 보기",
    ],
    goals: ["장학금 받기", "가족에게 부담 안 되기", "언젠가 유학"],
    appearancePrompt:
      "Korean female university student, warm gentle face, hair in a practical ponytail, wearing a convenience store uniform apron, slightly tired but smiling eyes",
    major: "영문학과",
    year: 2,
    sharedCourseIds: [],
    primaryLocationIds: ["work"],
  },

  // ─── CLUB MEMBER ────────────────────────────────────
  {
    id: "npc_dongho",
    name: "최동호",
    role: "club_member",
    personality: {
      openness: 90,
      conscientiousness: 25,
      extraversion: 75,
      agreeableness: 60,
      neuroticism: 50,
    },
    values: ["자유", "창작", "진정성"],
    speechPattern:
      "반말, 독특한 비유, 철학적인 말 갑자기 함, '근데 진짜 그게 뭔데?' 자주 물음.",
    backstory:
      "밴드 동아리에서 기타 치는 예체능과 학생. 자유로운 영혼이지만 학교 시스템과 끊임없이 충돌한다. 플레이어에게 '뭐하러 그렇게 열심히 사냐'고 하면서도, 본인도 음악에 미친 듯이 몰두한다.",
    quirks: [
      "동아리방에서 자주 잠",
      "수업 빠지고 작곡",
      "갑자기 심오한 질문",
    ],
    goals: ["버스킹 공연", "자작곡 앨범 내기", "학교에서 안 잘리기"],
    appearancePrompt:
      "Korean male university student, slightly long wavy hair, artistic vibe, wearing band t-shirt and ripped jeans, holding guitar pick, dreamy but intense eyes",
    major: "실용음악과",
    year: 2,
    sharedCourseIds: [],
    primaryLocationIds: ["club_room", "campus_outdoor"],
  },

  // ─── ROMANTIC INTEREST ──────────────────────────────
  {
    id: "npc_yuna",
    name: "정유나",
    role: "romantic_interest",
    personality: {
      openness: 75,
      conscientiousness: 60,
      extraversion: 50,
      agreeableness: 70,
      neuroticism: 55,
    },
    values: ["진심", "성장", "균형"],
    speechPattern:
      "부드럽지만 솔직한 말투, 질문을 많이 함, '넌 어떻게 생각해?' 자주 물음, 감정 표현은 서툼.",
    backstory:
      "같은 교양 수업에서 우연히 만난 심리학과 학생. 사람을 관찰하는 습관이 있어서 플레이어의 변화를 누구보다 빨리 눈치챈다. 쉽게 마음을 열지 않지만, 한번 열면 깊다.",
    quirks: [
      "대화 중 상대방 표정 분석",
      "혼자 산책 좋아함",
      "일기 매일 씀",
    ],
    goals: ["좋은 관계 만들기", "대학원 진학 고민", "자기 이해"],
    appearancePrompt:
      "Korean female university student, soft wavy brown hair, thoughtful gentle eyes, wearing a cozy knit sweater and long skirt, carrying a journal, warm but slightly reserved expression",
    major: "심리학과",
    year: 2,
    sharedCourseIds: [],
    primaryLocationIds: ["cafe", "campus_outdoor", "library"],
  },

  // ─── RIVAL ──────────────────────────────────────────
  {
    id: "npc_taehyun",
    name: "서태현",
    role: "rival",
    personality: {
      openness: 40,
      conscientiousness: 80,
      extraversion: 60,
      agreeableness: 25,
      neuroticism: 70,
    },
    values: ["승리", "인정", "자존심"],
    speechPattern:
      "정중하지만 은근히 깎아내리는 말투, 비교 자주 함, '아 그래? 나는~' 패턴, 웃으면서 독침.",
    backstory:
      "같은 과 동기. 겉으로는 친절하지만 모든 것을 경쟁으로 본다. 학점, 스펙, 인간관계 — 플레이어보다 앞서야 직성이 풀린다. 하지만 그 경쟁심의 뿌리는 불안감과 인정 욕구.",
    quirks: [
      "성적표 나오면 은근슬쩍 물어봄",
      "SNS에 스펙 자랑 포장",
      "혼자 있을 때 자기 비하",
    ],
    goals: ["학과 수석", "대기업 인턴", "모두에게 인정받기"],
    appearancePrompt:
      "Korean male university student, well-groomed short black hair, sharp confident eyes but tension in jaw, wearing neat button-up shirt, competitive but insecure aura",
    major: "동일학과",
    year: 2,
    sharedCourseIds: [],
    primaryLocationIds: ["classroom", "library", "cafe"],
  },
];

export function getCoreNPCById(id: string): NPCCharacterSheet | undefined {
  return CORE_NPC_SHEETS.find((npc) => npc.id === id);
}

export function getCoreNPCsByLocation(locationId: string): NPCCharacterSheet[] {
  return CORE_NPC_SHEETS.filter((npc) =>
    npc.primaryLocationIds.includes(locationId)
  );
}
