import { fail } from '@sveltejs/kit';
import { formatDate, getWeekEnding, getWeekStart, computeDailyTotal, stripSeconds } from '$lib/server/helpers';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const TIME_RE = /^\d{2}:\d{2}(:\d{2})?$/;

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

	let hourlyRate = 0;
	try {
		const { data: settings } = await supabase
			.from('user_settings')
			.select('hourly_rate')
			.eq('user_id', user!.id)
			.single();
		hourlyRate = settings?.hourly_rate ?? 0;
	} catch {
		hourlyRate = 0;
	}

	const dayEntries: { date: string; entry: any; dayIndex: number }[] = [];
	let weekTotal = 0;
	let weekPay = 0;

	for (let i = 0; i < 7; i++) {
		const d = new Date(weekStartDate);
		d.setDate(d.getDate() + i);
		const dateStr = formatDate(d);
		let entry: any = entries?.find((e: any) => e.date === dateStr) ?? null;
		if (entry) {
			entry = { ...entry };
			for (const k of ['morning_login', 'morning_logout', 'noon_login', 'noon_logout']) {
				entry[k] = stripSeconds(entry[k] as string | null);
			}
		}
		const total = entry?.daily_total_minutes ?? 0;
		const rate = entry?.hourly_rate ?? hourlyRate;
		weekTotal += total;
		weekPay += (total / 60) * rate;
		dayEntries.push({ date: dateStr, entry, dayIndex: i });
	}

	return { weekEnding, weekStart, dayEntries, weekTotal, weekPay, hourlyRate };
};

export const actions = {
	upsert: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();

		const date = (formData.get('date') as string) || '';
		if (!DATE_RE.test(date)) {
			return fail(400, { message: 'Invalid date format.', success: false });
		}

		const morningLogin = stripSeconds((formData.get('morning_login') as string) || '') || '';
		const morningLogout = stripSeconds((formData.get('morning_logout') as string) || '') || '';
		const noonLogin = stripSeconds((formData.get('noon_login') as string) || '') || '';
		const noonLogout = stripSeconds((formData.get('noon_logout') as string) || '') || '';

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

		let hourlyRate = 0;
		try {
			const { data: existing } = await supabase
				.from('time_entries')
				.select('hourly_rate')
				.eq('user_id', user!.id)
				.eq('date', date)
				.single();
			if (existing && existing.hourly_rate != null) {
				hourlyRate = existing.hourly_rate;
			} else {
				const { data: settings } = await supabase
					.from('user_settings')
					.select('hourly_rate')
					.eq('user_id', user!.id)
					.single();
				hourlyRate = settings?.hourly_rate ?? 0;
			}
		} catch {
			const { data: settings } = await supabase
				.from('user_settings')
				.select('hourly_rate')
				.eq('user_id', user!.id)
				.single();
			hourlyRate = settings?.hourly_rate ?? 0;
		}

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
				daily_total_minutes: dailyTotal,
				hourly_rate: hourlyRate
			},
			{ onConflict: 'user_id,date' }
		);

		if (error) {
			return fail(500, { message: 'Failed to save. Please try again.', success: false });
		}

		return { success: true, message: '' };
	},

	update_rate: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const rate = parseFloat((formData.get('hourly_rate') as string) || '0');
		if (isNaN(rate) || rate < 0) {
			return fail(400, { message: 'Invalid rate.', success: false });
		}

		const { error } = await supabase.from('user_settings').upsert(
			{
				user_id: user!.id,
				hourly_rate: rate,
				updated_at: new Date().toISOString()
			},
			{ onConflict: 'user_id' }
		);

		if (error) return fail(500, { message: 'Failed to save rate.', success: false });
		return { success: true, message: '' };
	}
};
