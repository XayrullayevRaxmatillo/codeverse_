// Server API tiplari (server/src/services/serialize.js va routes bilan mos)

export type Lang = 'uz' | 'ru' | 'en';
export type Tri = Record<Lang, string>;
export type Difficulty = 'easy' | 'medium' | 'hard';
export type NodeStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'mastered';

export interface LevelInfo {
  level: number;
  key: string;
  name: Tri;
  xp: number;
  currentMin: number;
  nextMin: number | null;
  progress: number;
}

export interface UserStats {
  lessonsCompleted: number;
  challengesCompleted: number;
  quizzesPassed: number;
  perfectQuizzes: number;
  examsPassed: number;
  projectsCompleted: number;
  codeRuns: number;
  battlesPlayed: number;
  gamesPlayed: number;
}

export interface Equipped {
  avatar: string;
  theme: string;
  frame: string;
}

export interface User {
  id: string;
  username: string;
  displayName: string;
  email: string;
  role: 'user' | 'admin';
  bio: string;
  xp: number;
  coins: number;
  level: LevelInfo;
  hearts: number;
  heartsNextInMs: number | null;
  streak: { current: number; best: number; todayDone: boolean };
  activityDays: string[];
  achievements: { key: string; unlockedAt: string }[];
  inventory: string[];
  equipped: Equipped;
  settings: { lang: Lang; theme: 'dark' | 'light' | 'system' };
  stats: UserStats;
  battleBest: { easy: number; medium: number; hard: number; daily: number };
  friends: string[];
  createdAt: string;
}

export interface AchievementInfo {
  key: string;
  title: Tri;
  description: Tri;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  rewardCoins?: number;
  unlocked?: boolean;
  unlockedAt?: string | null;
}

export interface Reward {
  gained: { xp: number; coins: number; items: { reason: string; xp: number; coins: number }[] };
  levelUp: LevelInfo | null;
  achievements: AchievementInfo[];
  streak: { current: number; best: number } | null;
  user: User;
}

export interface CourseSummary {
  id: string;
  slug: string;
  world: string;
  order: number;
  title: Tri;
  description: Tri;
  color: string;
  icon: string;
  prerequisite: string | null;
  comingSoon: boolean;
  unlocked: boolean;
  guestAvailable?: boolean;
  stats: { totalLessons: number; doneLessons: number; examsPassed: number; totalExams: number; percent: number } | null;
  complete: boolean;
  moduleCount: number;
  lessonCount?: number;
}

export interface LessonNode {
  id: string;
  slug: string;
  order: number;
  title: Tri;
  minutes: number;
  isGuest: boolean;
  hasChallenge: boolean;
  quizCount: number;
  status: NodeStatus;
  quizBest: number | null;
  challengeDone: boolean;
}

export interface ModuleNode {
  id: string;
  slug: string;
  order: number;
  title: Tri;
  description: Tri;
  passScore: number;
  unlocked: boolean;
  exam: { status: 'locked' | 'available' | 'completed'; best: number | null; attempts: number };
  done: number;
  total: number;
  lessons: LessonNode[];
}

export interface CourseDetail extends Omit<CourseSummary, 'moduleCount' | 'guestAvailable'> {
  modules: ModuleNode[];
  project: { id: string; key: string; title: Tri; difficulty: Difficulty; status: 'locked' | 'available' | 'completed' } | null;
  certificate: string | null;
  lastLesson: string | null;
}

export type SandboxMode = 'web' | 'js' | 'react';
export interface CodeFiles {
  html: string;
  css: string;
  js: string;
}

export interface Challenge {
  id: string;
  key: string;
  kind: 'lesson' | 'project' | 'practice';
  title: Tri;
  mode: SandboxMode;
  instructions: Tri;
  starter: CodeFiles;
  tests: { d: Tri; e: string }[];
  hints: Tri[];
  explanation: Tri;
  difficulty: Difficulty;
  course?: CourseSummary | null;
  status?: 'locked' | 'available' | 'completed';
  savedCode?: CodeFiles | null;
}

export type QuestionType = 'mcq' | 'tf' | 'fill' | 'out' | 'bug' | 'order' | 'match';
export interface Question {
  id: string;
  type: QuestionType;
  prompt: Tri;
  code?: string;
  difficulty: Difficulty;
  options?: Tri[];
  lines?: string[];
  left?: string[];
  right?: string[];
}
export type Answer = number | boolean | string | number[];

export interface QuestionResult {
  id: string;
  correct: boolean;
  explanation: Tri;
  answer?: { index?: number; value?: boolean; text?: string; lines?: string[]; pairs?: { left: string; right: string }[] } | null;
}
export interface GradeResult {
  results: QuestionResult[];
  score: number;
  total: number;
  percent: number;
}

export interface LessonProgress {
  started: boolean;
  completed: boolean;
  quizBest: number | null;
  challengeDone: boolean;
  savedCode: CodeFiles | null;
}

export interface LessonDetail {
  lesson: {
    id: string;
    slug: string;
    title: Tri;
    content: Tri;
    example: string;
    exampleMode: SandboxMode;
    minutes: number;
    isGuest: boolean;
    course: { id: string; slug: string; title: Tri; color: string; world: string };
    module: { id: string; slug: string; title: Tri; order: number };
    prevId: string | null;
    nextId: string | null;
    isLastInModule: boolean;
    position: { index: number; total: number };
  };
  challenge: Challenge | null;
  quiz: Question[];
  progress: LessonProgress;
}

export interface ExamDetail {
  module: { id: string; title: Tri; slug: string; passScore: number };
  course: { slug: string; title: Tri; color: string };
  status: string;
  best: number | null;
  attempts: number;
  timeLimitSec: number;
  questions: Question[];
}

export interface ShopItem {
  key: string;
  type: 'avatar' | 'theme' | 'frame';
  value: string;
  price: number;
  minLevel: number;
  name: Tri;
}

export interface LeaderRow {
  rank: number;
  id: string;
  username: string;
  displayName: string;
  equipped: Equipped;
  level: LevelInfo;
  xp: number;
}

export interface CertificateInfo {
  code: string;
  name: string;
  courseTitle: Tri;
  course: string | null;
  color: string | null;
  issuedAt: string;
}

export interface BattleSession {
  id: string;
  difficulty: Difficulty;
  timeLimitSec: number;
  questions: Question[];
  best: number;
}
