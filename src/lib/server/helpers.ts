export function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}-${m}-${d}`;
}

export function getWeekEnding(date: Date): Date {
	const d = new Date(date);
	const day = d.getDay();
	d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
	return d;
}

export function getWeekStart(weekEnding: Date): Date {
	const d = new Date(weekEnding);
	d.setDate(d.getDate() - 6);
	return d;
}

export function computeDailyTotal(
	morningLogin: string | null,
	morningLogout: string | null,
	noonLogin: string | null,
	noonLogout: string | null,
	breakDuration: number
): number {
	const segMinutes = (login: string | null, logout: string | null): number => {
		if (!login || !logout) return 0;
		const [lh, lm] = login.split(':').map(Number);
		const [loh, lom] = logout.split(':').map(Number);
		const start = lh * 60 + lm;
		const end = loh * 60 + lom;
		return end > start ? end - start : 0;
	};

	const morning = segMinutes(morningLogin, morningLogout);
	const noon = segMinutes(noonLogin, noonLogout);
	return Math.max(0, morning + noon - breakDuration);
}
