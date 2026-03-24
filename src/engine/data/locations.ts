export interface Location {
  id: string;
  name: { ko: string; en: string };
  description: string;
  artPrompt: string;
}

export const LOCATIONS: Location[] = [
  {
    id: "classroom",
    name: { ko: "강의실", en: "Classroom" },
    description: "대학 강의실. 빔 프로젝터와 계단식 좌석.",
    artPrompt:
      "University lecture hall with tiered seating, projector screen, warm lighting, books and notebooks on desks, Korean university atmosphere",
  },
  {
    id: "library",
    name: { ko: "도서관", en: "Library" },
    description: "조용한 중앙도서관. 개인 열람석과 높은 서가.",
    artPrompt:
      "Modern Korean university library interior, individual study desks with warm lamps, tall bookshelves, quiet studious atmosphere, large windows with natural light",
  },
  {
    id: "cafe",
    name: { ko: "카페", en: "Cafe" },
    description: "캠퍼스 근처 아늑한 카페. 학생들로 붐빔.",
    artPrompt:
      "Cozy Korean cafe near university campus, warm wood interior, students studying with laptops and coffee, soft ambient lighting, plants and bookshelves",
  },
  {
    id: "dorm",
    name: { ko: "기숙사 방", en: "Dorm Room" },
    description: "작은 2인실 기숙사. 책상 두 개와 이층 침대.",
    artPrompt:
      "Small Korean university dormitory room, two desks with study lamps, bunk bed, personal items and posters, cozy cramped but warm feeling",
  },
  {
    id: "campus_outdoor",
    name: { ko: "캠퍼스 야외", en: "Campus Outdoor" },
    description: "벤치와 나무가 있는 캠퍼스 중앙 광장.",
    artPrompt:
      "Korean university campus outdoor plaza with cherry blossom trees, benches, students walking between buildings, blue sky, modern university buildings in background",
  },
  {
    id: "work",
    name: { ko: "편의점 (알바)", en: "Convenience Store (Work)" },
    description: "24시간 편의점. 형광등 아래 진열대.",
    artPrompt:
      "Korean convenience store interior at night, fluorescent lighting, colorful product shelves, counter with register, late-night work atmosphere",
  },
  {
    id: "club_room",
    name: { ko: "동아리 방", en: "Club Room" },
    description: "약간 어수선한 동아리 방. 포스터와 악기, 잡동사니.",
    artPrompt:
      "Korean university club room, slightly messy, band instruments and posters on walls, bean bags, creative chaotic energy, warm incandescent lighting",
  },
  {
    id: "gym",
    name: { ko: "체육관", en: "Gym" },
    description: "대학 체육관. 운동 기구와 코트.",
    artPrompt:
      "Korean university gym interior, exercise equipment, basketball court visible, bright overhead lighting, energetic sporty atmosphere",
  },
  {
    id: "cafeteria",
    name: { ko: "학생 식당", en: "Cafeteria" },
    description: "저렴한 학생 식당. 줄 서서 배식.",
    artPrompt:
      "Korean university cafeteria, long tables with students eating, food counter with trays, affordable meal atmosphere, bustling lunchtime energy",
  },
  {
    id: "rooftop",
    name: { ko: "옥상", en: "Rooftop" },
    description: "건물 옥상. 도시 야경이 보이는 비밀 장소.",
    artPrompt:
      "University building rooftop at night, city skyline view with lights, railing, quiet dramatic atmosphere, stars visible, romantic and contemplative mood",
  },
];

export function getLocationById(id: string): Location | undefined {
  return LOCATIONS.find((loc) => loc.id === id);
}
