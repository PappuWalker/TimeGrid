import { fail } from '@sveltejs/kit';
import { formatDate, getWeekEnding, getWeekStart, computeDailyTotal } from '$lib/server/helpers';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}$/;

function parseWeekParam(param: string | null): Date {
	if (!param) return getWeekEnding(new Date());
	const d = new Date(param + 'T12:00:00');
	return isNaN(d.getTime()) ? getWeekEnding(new Date()) : d;
}

export const load = async ({ url, locals: { supabase, user } }) => {
	const weekEndingDate = parseWeekParam(url.searchParams.get('week'));
	const weekStartDate = getWeekStart(weekEndingDate);

	const weekEnding = formatDate(weekEndingDate);
	const weekStart = formatDate(weekStartDate);

	let entries: any[] = [];
	try {
		const { data } = await supabase
			.from('time_entries')
			.select('*')
			.eq('user_id', user!.id)
			.gte('date', weekStart)
			.lte('date', weekEnding)
			.order('date');
		entries = data ?? [];
	} catch {
		entries = [];
	}

	const dayEntries: { date: string; entry: any; dayIndex: number }[] = [];
	let weekTotal = 0;

	for (let i = 0; i < 7; i++) {
		const d = new Date(weekStartDate);
		d.setDate(d.getDate() + i);
		const dateStr = formatDate(d);
		const entry = entries?.find((e: any) => e.date === dateStr) ?? null;
		const total = entry?.daily_total_minutes ?? 0;
		weekTotal += total;
		dayEntries.push({ date: dateStr, entry, dayIndex: i });
	}

	return { weekEnding, weekStart, dayEntries, weekTotal };
};

export const actions = {
	upsert: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();

		const date = (formData.get('date') as string) || '';
		if (!DATE_RE.test(date)) {
			return fail(400, { message: 'Invalid date format.', success: false });
		}

		const morningLogin = (formData.get('morning_login') as string) || '';
		const morningLogout = (formData.get('morning_logout') as string) || '';
		const noonLogin = (formData.get('noon_login') as string) || '';
		const noonLogout = (formData.get('noon_logout') as string) || '';

		const timeOk = (v: string) => !v || TIME_RE.test(v);
		if (!timeOk(morningLogin) || !timeOk(morningLogout) || !timeOk(noonLogin) || !timeOk(noonLogout)) {
			return fail(400, { message: 'Invalid time format. Use HH:MM.', success: false });
		}

		const rawBreak = formData.get('break_duration') as string;
		const breakDuration = Math.max(0, parseInt(rawBreak) || 0);

		const dailyTotal = computeDailyTotal(
			morningLogin || null, morningLogout || null,
			noonLogin || null, noonLogout || null,
			breakDuration
		);

		const dateObj = new Date(date + 'T00:00:00');
		const weekEnding = formatDate(getWeekEnding(dateObj));

		const { error } = await supabase.from('time_entries').upsert(
			{
				user_id: user!.id,
				date,
				week_ending_date: weekEnding,
				morning_login: morningLogin || null,
				morning_logout: morningLogout || null,
				noon_login: noonLogin || null,
				noon_logout: noonLogout || null,
				break_duration_minutes: breakDuration,
				daily_total_minutes: dailyTotal
			},
			{ onConflict: 'user_id,date' }
		);

		if (error) {
			return fail(500, { message: 'Failed to save. Please try again.', success: false });
		}

		return { success: true, message: '' };
	}
};
