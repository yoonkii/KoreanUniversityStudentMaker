/**
 * Campus Locations — named, specific places instead of generic types
 *
 * Instead of just "library" or "cafe", the game references actual
 * named spots on campus. Rotates by week/day for variety.
 */

export interface CampusSpot {
  name: string;      // Specific name
  type: string;      // Generic type for background matching
  description: string;
  vibe: string;      // One-word atmosphere
}

// Named campus locations for each activity type
const STUDY_SPOTS: CampusSpot[] = [
  { name: '중앙도서관 3층 열람실', type: 'library', description: '조용한 열람실. 자리 잡기 경쟁이 치열하다.', vibe: '집중' },
  { name: '공학관 스터디룸', type: 'library', description: '4인용 스터디룸. 화이트보드가 있어 좋다.', vibe: '협업' },
  { name: '학생회관 자습실', type: 'library', description: '24시간 개방. 밤샘 학생들의 성지.', vibe: '열정' },
  { name: '카페 "책과 커피"', type: 'cafe', description: '학교 앞 북카페. 아메리카노가 저렴하다.', vibe: '여유' },
];

const FOOD_SPOTS: CampusSpot[] = [
  { name: '학생식당 (본관)', type: 'cafeteria', description: '3,500원 정식. 가성비 최고.', vibe: '실속' },
  { name: '학교 앞 분식집 "엄마손"', type: 'restaurant', description: '떡볶이와 순대가 유명하다.', vibe: '추억' },
  { name: '카페 "릴렉스"', type: 'cafe', description: '학생 할인 아메리카노 2,000원.', vibe: '힐링' },
  { name: '편의점 (기숙사 1층)', type: 'convenience_store', description: '삼각김밥과 컵라면의 성지.', vibe: '간편' },
  { name: '학교 앞 치킨집 "황금통닭"', type: 'restaurant', description: '종강 후 치맥의 성지.', vibe: '축하' },
];

const HANGOUT_SPOTS: CampusSpot[] = [
  { name: '캠퍼스 잔디밭', type: 'campus', description: '봄에는 벚꽃, 가을에는 단풍. 돗자리 필수.', vibe: '낭만' },
  { name: '학교 앞 보드게임 카페', type: 'cafe', description: '보드게임 무료 대여. 시간 가는 줄 모른다.', vibe: '재미' },
  { name: '대학로 영화관', type: 'cinema', description: '학생 할인 7,000원. 조조 영화가 인기.', vibe: '문화' },
  { name: '캠퍼스 뒷산 산책로', type: 'campus', description: '10분이면 정상. 석양이 예쁘다.', vibe: '힐링' },
];

const EXERCISE_SPOTS: CampusSpot[] = [
  { name: '종합체육관 헬스장', type: 'gym', description: '학생 무료 이용. 러닝머신이 인기.', vibe: '건강' },
  { name: '운동장 트랙', type: 'campus', description: '저녁 러닝하기 좋다. 선선한 바람.', vibe: '상쾌' },
  { name: '농구코트 (체육관 뒤)', type: 'gym', description: '학생들이 항상 모여 있다.', vibe: '활기' },
];

/**
 * Get a specific named location for an activity.
 * Rotates by week + day for variety.
 */
export function getSpecificLocation(activityType: string, week: number, dayIndex: number): CampusSpot {
  let pool: CampusSpot[];
  switch (activityType) {
    case 'study': case 'lecture': pool = STUDY_SPOTS; break;
    case 'friends': case 'date': pool = HANGOUT_SPOTS; break;
    case 'exercise': pool = EXERCISE_SPOTS; break;
    case 'parttime': pool = [{ name: '카페 "릴렉스" (알바)', type: 'cafe', description: '오늘도 열심히 일하는 중.', vibe: '성실' }]; break;
    case 'rest': pool = [
      { name: '기숙사 방', type: 'dorm', description: '나만의 안식처. 침대가 나를 부른다.', vibe: '편안' },
      { name: '기숙사 라운지', type: 'dorm', description: '소파에서 넷플릭스. 최고의 사치.', vibe: '여유' },
    ]; break;
    case 'club': pool = [
      { name: '동아리 연습실 B2', type: 'club_room', description: '방음이 잘 된다. 마음껏 연주 가능.', vibe: '열정' },
    ]; break;
    default: pool = FOOD_SPOTS; break;
  }

  const idx = ((week * 7 + dayIndex) >>> 0) % pool.length;
  return pool[idx];
}

/**
 * Get a location-specific flavor line for the action phase.
 */
export function getLocationFlavor(spot: CampusSpot): string {
  return `📍 ${spot.name} — ${spot.description}`;
}
