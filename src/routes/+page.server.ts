import { fail } from '@sveltejs/kit';

export const load = async ({ locals: { supabase, user } }) => {
	let entries: any[] = [];
	try {
		const { data } = await supabase
			.from('time_entries')
			.select('week_ending_date, daily_total_minutes, hourly_rate')
			.eq('user_id', user!.id)
			.order('date', { ascending: false });
		entries = data ?? [];
	} catch {
		entries = [];
	}

	let paidWeeks: string[] = [];
	try {
		const { data: pd } = await supabase
			.from('week_paid')
			.select('week_ending_date')
			.eq('user_id', user!.id);
		paidWeeks = (pd ?? []).map((r: any) => r.week_ending_date);
	} catch {
		paidWeeks = [];
	}

	const paidSet = new Set(paidWeeks);

	const weekMap = new Map<string, { weekEnding: string; totalMinutes: number; totalPay: number; paid: boolean }>();

	for (const e of entries) {
		const week = e.week_ending_date;
		if (!weekMap.has(week)) {
			weekMap.set(week, { weekEnding: week, totalMinutes: 0, totalPay: 0, paid: paidSet.has(week) });
		}
		const w = weekMap.get(week)!;
		const mins = e.daily_total_minutes || 0;
		w.totalMinutes += mins;
		w.totalPay += (mins / 60) * (e.hourly_rate || 0);
	}

	const weeks = Array.from(weekMap.values());
	const unpaidOnly = weeks.filter((w) => !w.paid);
	const grandTotalMinutes = unpaidOnly.reduce((s, w) => s + w.totalMinutes, 0);
	const grandTotalPay = unpaidOnly.reduce((s, w) => s + w.totalPay, 0);

	return { weeks, grandTotalMinutes, grandTotalPay };
};

export const actions = {
	toggle_paid: async ({ request, locals: { supabase, user } }) => {
		const formData = await request.formData();
		const weekEnding = (formData.get('week_ending') as string) || '';
		const paid = formData.get('paid') === 'true';

		if (paid) {
			await supabase.from('week_paid').upsert(
				{ user_id: user!.id, week_ending_date: weekEnding, paid_at: new Date().toISOString() },
				{ onConflict: 'user_id,week_ending_date' }
			);
		} else {
			await supabase.from('week_paid').delete().eq('user_id', user!.id).eq('week_ending_date', weekEnding);
		}

		return { success: true };
	}
};
