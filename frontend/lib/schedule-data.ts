export interface AnimeRelease {
  id: string;
  title: string;
  episode: number;
  time: string;
  timeRaw: number; // minutes from midnight for sorting
  posterUrl: string;
  isReminded: boolean;
}

export interface DaySchedule {
  day: string;
  shortDay: string;
  date: string;
  isToday: boolean;
  releases: AnimeRelease[];
}

export const periods = [
  { id: "2026-04", label: "2026-04", current: true },
  { id: "2026-01", label: "2026-01", current: false },
  { id: "2025-10", label: "2025-10", current: false },
  { id: "2025-07", label: "2025-07", current: false },
];

export const weekSchedule: DaySchedule[] = [
  {
    day: "Monday",
    shortDay: "Mon",
    date: "Apr 21",
    isToday: false,
    releases: [
      { id: "1", title: "Demon Slayer: Infinity Castle", episode: 8, time: "10:00 AM", timeRaw: 600, posterUrl: "/posters/demon-slayer.jpg", isReminded: true },
      { id: "2", title: "Solo Leveling: Arise", episode: 12, time: "2:30 PM", timeRaw: 870, posterUrl: "/posters/solo-leveling.jpg", isReminded: false },
      { id: "3", title: "Blue Lock Part 3", episode: 5, time: "6:00 PM", timeRaw: 1080, posterUrl: "/posters/blue-lock.jpg", isReminded: false },
    ],
  },
  {
    day: "Tuesday",
    shortDay: "Tue",
    date: "Apr 22",
    isToday: true,
    releases: [
      { id: "4", title: "Jujutsu Kaisen: Culling Game", episode: 15, time: "11:00 AM", timeRaw: 660, posterUrl: "/posters/jujutsu-kaisen.jpg", isReminded: true },
      { id: "5", title: "Chainsaw Man Part 2", episode: 7, time: "1:00 PM", timeRaw: 780, posterUrl: "/posters/chainsaw-man.jpg", isReminded: false },
      { id: "6", title: "Spy x Family Part 3", episode: 9, time: "4:30 PM", timeRaw: 990, posterUrl: "/posters/spy-family.jpg", isReminded: true },
      { id: "7", title: "Oshi no Ko Part 2", episode: 11, time: "8:00 PM", timeRaw: 1200, posterUrl: "/posters/oshi-no-ko.jpg", isReminded: false },
    ],
  },
  {
    day: "Wednesday",
    shortDay: "Wed",
    date: "Apr 23",
    isToday: false,
    releases: [
      { id: "8", title: "My Hero Academia: Final", episode: 6, time: "9:30 AM", timeRaw: 570, posterUrl: "/posters/mha.jpg", isReminded: false },
      { id: "9", title: "Frieren: Beyond Journey's End", episode: 18, time: "3:00 PM", timeRaw: 900, posterUrl: "/posters/frieren.jpg", isReminded: true },
    ],
  },
  {
    day: "Thursday",
    shortDay: "Thu",
    date: "Apr 24",
    isToday: false,
    releases: [
      { id: "10", title: "Attack on Titan: Epilogue", episode: 3, time: "12:00 PM", timeRaw: 720, posterUrl: "/posters/aot.jpg", isReminded: true },
      { id: "11", title: "Vinland Saga Final", episode: 10, time: "5:00 PM", timeRaw: 1020, posterUrl: "/posters/vinland-saga.jpg", isReminded: false },
      { id: "12", title: "Haikyuu!! Final Arc", episode: 14, time: "9:00 PM", timeRaw: 1260, posterUrl: "/posters/haikyuu.jpg", isReminded: false },
    ],
  },
  {
    day: "Friday",
    shortDay: "Fri",
    date: "Apr 25",
    isToday: false,
    releases: [
      { id: "13", title: "One Piece", episode: 1145, time: "7:00 AM", timeRaw: 420, posterUrl: "/posters/one-piece.jpg", isReminded: true },
      { id: "14", title: "Mashle Part 3", episode: 4, time: "2:00 PM", timeRaw: 840, posterUrl: "/posters/mashle.jpg", isReminded: false },
    ],
  },
  {
    day: "Saturday",
    shortDay: "Sat",
    date: "Apr 26",
    isToday: false,
    releases: [
      { id: "15", title: "Dragon Ball Daima", episode: 22, time: "8:30 AM", timeRaw: 510, posterUrl: "/posters/dragon-ball.jpg", isReminded: false },
      { id: "16", title: "Kaiju No. 8", episode: 16, time: "11:30 AM", timeRaw: 690, posterUrl: "/posters/kaiju-no-8.jpg", isReminded: true },
      { id: "17", title: "Dandadan", episode: 20, time: "4:00 PM", timeRaw: 960, posterUrl: "/posters/dandadan.jpg", isReminded: false },
      { id: "18", title: "Re:Zero Part 4", episode: 8, time: "10:00 PM", timeRaw: 1320, posterUrl: "/posters/rezero.jpg", isReminded: true },
    ],
  },
  {
    day: "Sunday",
    shortDay: "Sun",
    date: "Apr 27",
    isToday: false,
    releases: [
      { id: "19", title: "Bleach: Thousand-Year Blood War", episode: 25, time: "10:30 AM", timeRaw: 630, posterUrl: "/posters/bleach.jpg", isReminded: true },
      { id: "20", title: "Boruto: Two Blue Vortex", episode: 13, time: "3:30 PM", timeRaw: 930, posterUrl: "/posters/boruto.jpg", isReminded: false },
      { id: "21", title: "Hell's Paradise Part 2", episode: 6, time: "7:30 PM", timeRaw: 1170, posterUrl: "/posters/hells-paradise.jpg", isReminded: false },
    ],
  },
];

export function getNextRelease(): AnimeRelease & { day: string; countdown: string } {
  // For demo purposes, return the next release from today's schedule
  const todaySchedule = weekSchedule.find(d => d.isToday);
  if (todaySchedule && todaySchedule.releases.length > 0) {
    // Simulate that the next release is coming up soon
    const nextRelease = todaySchedule.releases[1]; // Get the second release as "next"
    return {
      ...nextRelease,
      day: todaySchedule.day,
      countdown: "2h 34m",
    };
  }
  return {
    ...weekSchedule[0].releases[0],
    day: weekSchedule[0].day,
    countdown: "Tomorrow",
  };
}
