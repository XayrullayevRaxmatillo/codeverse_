import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ApiError, del, get, patch, post, put } from '../lib/api';
import type {
  AchievementInfo,
  Answer,
  BattleSession,
  CertificateInfo,
  Challenge,
  CodeFiles,
  CourseDetail,
  CourseSummary,
  ExamDetail,
  GradeResult,
  LeaderRow,
  LessonDetail,
  LessonProgress,
  Question,
  QuestionResult,
  Reward,
  ShopItem,
  User,
} from '../types';
import { useAuth } from '../context/AuthContext';

export const useCourses = () => {
  const { user } = useAuth();
  return useQuery({ queryKey: ['courses', user?.id ?? 'guest'], queryFn: () => get<{ courses: CourseSummary[] }>('/courses').then((r) => r.courses) });
};

export const useCourse = (slug: string | undefined) => {
  const { user } = useAuth();
  return useQuery({ queryKey: ['course', slug, user?.id ?? 'guest'], enabled: !!slug, queryFn: () => get<{ course: CourseDetail }>(`/courses/${slug}`).then((r) => r.course) });
};

export const useLesson = (id: string | undefined) => {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['lesson', id, user?.id ?? 'guest'],
    enabled: !!id,
    queryFn: () => get<LessonDetail>(user ? `/lessons/${id}` : `/public/lessons/${id}`),
    retry: (n, e) => n < 1 && !(e instanceof ApiError && [401, 403, 404].includes(e.status)),
  });
};

/** Dars/kurs/progress o'zgargandan keyin keshlarni yangilash */
export function useInvalidateProgress() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ predicate: (q) => ['courses', 'course', 'lesson', 'stats', 'challenges', 'exam'].includes(String(q.queryKey[0])) });
}

export interface QuizResponse {
  result: GradeResult;
  passed?: boolean;
  lessonCompleted?: boolean;
  progress?: LessonProgress;
  reward?: Reward | null;
  guest?: boolean;
}

export const submitLessonQuiz = (lessonId: string, answers: Record<string, Answer>, guest: boolean) => post<QuizResponse>(guest ? `/public/lessons/${lessonId}/quiz` : `/lessons/${lessonId}/quiz`, { answers });

export interface SubmitChallengeResponse {
  ok: boolean;
  explanation: Challenge['explanation'];
  lessonCompleted: boolean;
  progress: LessonProgress | null;
  reward: Reward | null;
}
export const submitChallenge = (id: string, code: CodeFiles) => post<SubmitChallengeResponse>(`/challenges/${id}/submit`, { code, passed: true });
export const saveLessonCode = (lessonId: string, code: CodeFiles) => put(`/lessons/${lessonId}/code`, code);
export const saveProjectCode = (id: string, code: CodeFiles) => put(`/challenges/${id}/code`, code);
export const completeLesson = (lessonId: string) => post<{ lessonCompleted: boolean; progress: LessonProgress; reward: Reward | null }>(`/lessons/${lessonId}/complete`);
export const markRun = () => post<{ ok: boolean; reward: Reward | null }>('/progress/run');

export const useChallenges = (kind: 'project' | 'practice') => useQuery({ queryKey: ['challenges', kind], queryFn: () => get<{ challenges: Challenge[] }>('/challenges', { kind }).then((r) => r.challenges) });
export const useChallenge = (id: string | undefined) => useQuery({ queryKey: ['challenges', 'one', id], enabled: !!id, queryFn: () => get<{ challenge: Challenge }>(`/challenges/${id}`).then((r) => r.challenge) });

export const useExam = (moduleId: string | undefined) => useQuery({ queryKey: ['exam', moduleId], enabled: !!moduleId, queryFn: () => get<{ exam: ExamDetail }>(`/modules/${moduleId}/exam`).then((r) => r.exam), retry: false });
export const submitExam = (moduleId: string, answers: Record<string, Answer>) => post<{ result: GradeResult; passed: boolean; passScore: number; best: number; reward: Reward | null }>(`/modules/${moduleId}/exam`, { answers });

// ---- O'yin / jang ----
export const startGame = (body: { course?: string; type: string; count?: number }) => post<{ game: { id: string; questions: Question[]; hearts: number; heartsNextInMs: number | null } }>('/play/game/start', body).then((r) => r.game);
export const answerGame = (gameId: string, questionId: string, answer: Answer) =>
  post<{ correct: boolean; explanation: QuestionResult['explanation']; answer: QuestionResult['answer']; hearts: number; heartsNextInMs: number | null; reward: Reward | null; finished: boolean; score: number }>(`/play/game/${gameId}/answer`, { questionId, answer });
export const refillHearts = () => post<{ user: User }>('/play/hearts/refill');

export interface BattleResult {
  result: { results: QuestionResult[]; correct: number; total: number; score: number; late: boolean; elapsedMs: number; best: number; newBest: boolean };
  reward: Reward | null;
}
export const startBattle = (difficulty: string, course?: string) => post<{ battle: BattleSession }>('/play/battle/start', { difficulty, course }).then((r) => r.battle);
export const finishBattle = (id: string, answers: Record<string, Answer>, daily = false) => post<BattleResult>(daily ? `/play/daily/${id}/finish` : `/play/battle/${id}/finish`, { answers });
export const useDaily = () => useQuery({ queryKey: ['daily'], queryFn: () => get<{ daily: { day: string; played: boolean; inProgress: boolean; score: number | null; correct: number | null; best: number; top: { username: string; displayName: string; avatar: string; score: number; correct: number }[] } }>('/play/daily').then((r) => r.daily) });
export const startDaily = () => post<{ battle: BattleSession }>('/play/daily/start').then((r) => r.battle);

// ---- Ijtimoiy ----
export const useLeaderboard = (period: string, scope: string) =>
  useQuery({ queryKey: ['leaderboard', period, scope], queryFn: () => get<{ rows: LeaderRow[]; me: LeaderRow | null }>('/leaderboard', { period, scope }) });

export const useAchievements = () => {
  const { user } = useAuth();
  return useQuery({ queryKey: ['achievements', user?.id ?? 'guest'], queryFn: () => get<{ achievements: AchievementInfo[] }>('/achievements').then((r) => r.achievements) });
};

export const useMyStats = (enabled = true) =>
  useQuery({
    queryKey: ['stats', 'me'],
    enabled,
    queryFn: () =>
      get<{ daily: { day: string; xp: number }[]; byReason: { reason: string; xp: number; count: number }[]; courses: { slug: string; title: CourseSummary['title']; color: string; completedLessons: number; examsPassed: number; completed: boolean }[] }>('/users/me/stats'),
  });

export interface PublicProfileResponse {
  profile: Pick<User, 'id' | 'username' | 'displayName' | 'bio' | 'xp' | 'level' | 'achievements' | 'equipped' | 'stats' | 'activityDays' | 'createdAt'> & { streak: { current: number; best: number } };
  certificates: { code: string; courseTitle: CourseSummary['title']; course: string; color: string; issuedAt: string }[];
  achievements: AchievementInfo[];
  courses: { slug: string; title: CourseSummary['title']; color: string; completedLessons: number; completed: boolean }[];
}
export const useProfile = (username: string | undefined) => useQuery({ queryKey: ['profile', username], enabled: !!username, queryFn: () => get<PublicProfileResponse>(`/users/${username}`) });

export const useFriends = (enabled = true) => useQuery({ queryKey: ['friends'], enabled, queryFn: () => get<{ friends: { id: string; username: string; displayName: string; xp: number; level: User['level']; equipped: User['equipped'] }[] }>('/users/me/friends').then((r) => r.friends) });

export function useUserMutation<TBody>(fn: (b: TBody) => Promise<{ user: User }>) {
  const { setUser } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (r) => {
      setUser(r.user);
      qc.invalidateQueries({ queryKey: ['friends'] });
      qc.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });
}

export const updateMe = (body: { displayName?: string; bio?: string; settings?: Partial<User['settings']> }) => patch<{ user: User }>('/users/me', body);
export const addFriend = (username: string) => post<{ user: User }>('/users/me/friends', { username });
export const removeFriend = (id: string) => del<{ user: User }>(`/users/me/friends/${id}`);
export const buyItem = (item: string) => post<{ user: User }>('/users/shop/buy', { item });
export const equipItem = (item: string) => post<{ user: User }>('/users/me/equip', { item });
export const useShop = () => useQuery({ queryKey: ['shop'], staleTime: Infinity, queryFn: () => get<{ items: ShopItem[] }>('/users/shop/items').then((r) => r.items) });

export const useCertificates = () => useQuery({ queryKey: ['certificates'], queryFn: () => get<{ certificates: CertificateInfo[] }>('/certificates').then((r) => r.certificates) });
export const claimCertificate = (slug: string) => post<{ certificate: CertificateInfo }>(`/certificates/claim/${slug}`);
export const verifyCertificate = (code: string) => get<{ certificate: CertificateInfo }>(`/certificates/verify/${encodeURIComponent(code)}`).then((r) => r.certificate);

export const sendReport = (body: { targetType: string; targetId?: string; reason?: string; message?: string }) => post<{ id: string }>('/reports', body);

// ---- AI ----
export const useAiStatus = () => useQuery({ queryKey: ['ai-status'], staleTime: 60_000, queryFn: () => get<{ enabled: boolean; provider: string | null; setup: string | null }>('/ai/status') });
export const askMentor = (body: { mode: string; lang: string; message?: string; code?: string; error?: string; lessonId?: string; challengeId?: string; history?: { role: 'user' | 'assistant'; content: string }[] }) => post<{ reply: string }>('/ai/chat', body);
