export type PeriodMode = 'month' | 'custom';

export interface SavedPeriodHistoryItem {
  id: string;
  labelTh: string;
  labelEn: string;
  mode: PeriodMode;
  month?: string;
  year?: string;
  startDate?: string;
  endDate?: string;
}

export interface UserPeriodCookieData {
  mode: PeriodMode;
  selectedMonth: string;
  selectedYear: string;
  customStartDate: string;
  customEndDate: string;
  recentPeriods: SavedPeriodHistoryItem[];
}

const COOKIE_PREFIX = 'pos_period_pref_';
const MAX_AGE_SECONDS = 60 * 60 * 24 * 90; // 90 days

export function getDefaultPeriodData(): UserPeriodCookieData {
  const now = new Date();
  const currentMonth = String(now.getMonth() + 1).padStart(2, '0');
  const currentYear = String(now.getFullYear());
  const firstDayOfMonth = `${currentYear}-${currentMonth}-01`;
  const todayIso = now.toISOString().split('T')[0];

  return {
    mode: 'month',
    selectedMonth: currentMonth,
    selectedYear: '2026',
    customStartDate: firstDayOfMonth,
    customEndDate: todayIso,
    recentPeriods: [],
  };
}

export function readUserPeriodCookie(userId?: number | string | null): UserPeriodCookieData {
  const defaults = getDefaultPeriodData();
  if (typeof document === 'undefined') return defaults;

  const cookieName = `${COOKIE_PREFIX}${userId || 'guest'}`;
  const cookies = document.cookie ? document.cookie.split('; ') : [];

  for (const part of cookies) {
    const [rawName, ...rest] = part.split('=');
    if (rawName === cookieName) {
      try {
        const decoded = decodeURIComponent(rest.join('='));
        const parsed = JSON.parse(decoded) as Partial<UserPeriodCookieData>;
        return {
          mode: parsed.mode === 'custom' ? 'custom' : 'month',
          selectedMonth: parsed.selectedMonth || defaults.selectedMonth,
          selectedYear: parsed.selectedYear || defaults.selectedYear,
          customStartDate: parsed.customStartDate || defaults.customStartDate,
          customEndDate: parsed.customEndDate || defaults.customEndDate,
          recentPeriods: Array.isArray(parsed.recentPeriods) ? parsed.recentPeriods.slice(0, 5) : [],
        };
      } catch {
        return defaults;
      }
    }
  }

  return defaults;
}

export function writeUserPeriodCookie(
  userId: number | string | null | undefined,
  data: UserPeriodCookieData
): void {
  if (typeof document === 'undefined') return;

  const cookieName = `${COOKIE_PREFIX}${userId || 'guest'}`;
  try {
    const serialized = encodeURIComponent(
      JSON.stringify({
        ...data,
        recentPeriods: (data.recentPeriods || []).slice(0, 5),
      })
    );
    document.cookie = `${cookieName}=${serialized}; path=/; max-age=${MAX_AGE_SECONDS}; SameSite=Lax`;
  } catch (err) {
    console.error('Failed to save period preference cookie:', err);
  }
}
