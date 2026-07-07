<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { slide } from 'svelte/transition';

	let { data, form } = $props();

	const DAY_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

	let openDay = $state<string | null>(null);
	let morningLogin = $state('');
	let morningLogout = $state('');
	let noonLogin = $state('');
	let noonLogout = $state('');
	let breakDuration = $state(0);
	let saving = $state(false);
	let editingRate = $state(false);
	let localRate = $state(0);
	$effect(() => { if (!editingRate) localRate = data.hourlyRate; });

	function stripSeconds(v: string): string {
		return v.length > 5 ? v.substring(0, 5) : v;
	}

	function openDayForm(date: string, entry: Record<string, unknown> | null) {
		openDay = date;
		morningLogin = stripSeconds((entry?.morning_login as string) ?? '');
		morningLogout = stripSeconds((entry?.morning_logout as string) ?? '');
		noonLogin = stripSeconds((entry?.noon_login as string) ?? '');
		noonLogout = stripSeconds((entry?.noon_logout as string) ?? '');
		breakDuration = (entry?.break_duration_minutes as number) ?? 0;
	}

	function closeDayForm() {
		openDay = null;
		saving = false;
	}

	let previewTotal = $derived.by(() => {
		const seg = (login: string, logout: string): number => {
			if (!login || !logout) return 0;
			const [lh, lm] = login.split(':').map(Number);
			const [loh, lom] = logout.split(':').map(Number);
			return Math.max(0, loh * 60 + lom - (lh * 60 + lm));
		};
		return Math.max(0, seg(morningLogin, morningLogout) + seg(noonLogin, noonLogout));
	});

	function formatHHMM(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
	}

	function formatCurrency(amount: number): string {
		return '$' + amount.toFixed(4);
	}

	function toDate(dateStr: string): Date {
		return new Date(dateStr + 'T12:00:00');
	}

	function formatLongDate(dateStr: string): string {
		return toDate(dateStr).toLocaleDateString('en-US', {
			weekday: 'long', month: 'long', day: 'numeric', year: 'numeric'
		});
	}

	function formatShort(dateStr: string): string {
		return toDate(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
	}

	function getDayNumber(dateStr: string): number {
		return toDate(dateStr).getDate();
	}

	function todayStr(): string {
		const t = new Date();
		const y = t.getFullYear();
		const m = String(t.getMonth() + 1).padStart(2, '0');
		const d = String(t.getDate()).padStart(2, '0');
		return `${y}-${m}-${d}`;
	}

	function isToday(dateStr: string): boolean {
		return dateStr === todayStr();
	}

	function isCurrentWeek(): boolean {
		return todayStr() >= data.weekStart && todayStr() <= data.weekEnding;
	}

	function navigateWeek(offset: number) {
		const d = toDate(data.weekEnding);
		d.setDate(d.getDate() + offset * 7);
		const y = d.getFullYear();
		const mo = String(d.getMonth() + 1).padStart(2, '0');
		const day = String(d.getDate()).padStart(2, '0');
		goto(`/calendar?week=${y}-${mo}-${day}`);
	}

	function goToToday() {
		const d = new Date();
		const day = d.getDay();
		d.setDate(d.getDate() + (day === 0 ? 0 : 7 - day));
		const y = d.getFullYear();
		const mo = String(d.getMonth() + 1).padStart(2, '0');
		const dayStr = String(d.getDate()).padStart(2, '0');
		goto(`/calendar?week=${y}-${mo}-${dayStr}`);
	}

	function formatWeekRange(): string {
		const end = toDate(data.weekEnding);
		const start = toDate(data.weekStart);
		const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		return `${s} – ${e}`;
	}
</script>

<div class="space-y-6 sm:space-y-8">
	<!-- Week header + totals -->
	<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
		<div class="space-y-0.5">
			<p class="text-sm font-medium text-slate-500">Week of</p>
			<h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">{formatWeekRange()}</h1>
		</div>
		<div class="flex flex-wrap items-stretch gap-3">
			<div class="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 shadow-lg shadow-indigo-200/50">
				<p class="text-[11px] font-semibold text-indigo-100 uppercase tracking-widest">Week Total</p>
				<p class="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">{formatHHMM(data.weekTotal)}</p>
			</div>
			<div class="bg-white border border-slate-200 rounded-2xl px-5 sm:px-6 py-3.5 sm:py-4 shadow-sm">
				<p class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">Week Pay</p>
				<p class="text-2xl sm:text-3xl font-bold font-mono text-emerald-600 tabular-nums">{formatCurrency(data.weekPay)}</p>
			</div>
		</div>
	</div>

	<!-- Hourly Rate -->
	<div class="flex items-center gap-2 text-sm text-slate-500">
		<span class="font-medium">Hourly Rate:</span>
		{#if editingRate}
			<form method="POST" action="?/update_rate" use:enhance={() => {
				return async ({ result, update }) => {
					if (result.type === 'success') editingRate = false;
					update();
				};
			}} class="inline-flex items-center gap-2">
				<input
					type="number"
					name="hourly_rate"
					bind:value={localRate}
					min="0"
					step="0.0001"
					class="w-28 rounded-lg border border-slate-200 px-2.5 py-1 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
				/>
				<button type="submit" class="text-xs font-semibold text-indigo-600 hover:text-indigo-700">Save</button>
				<button type="button" onclick={() => { editingRate = false; localRate = data.hourlyRate; }} class="text-xs text-slate-400 hover:text-slate-600">Cancel</button>
			</form>
		{:else}
			<button type="button" onclick={() => { editingRate = true; localRate = data.hourlyRate; }} class="font-mono font-semibold text-slate-800 hover:text-indigo-600 hover:underline">
				{formatCurrency(data.hourlyRate)}/hr
			</button>
		{/if}
	</div>

	<!-- Navigation bar -->
	<div class="flex items-center justify-between gap-3">
		<div class="flex items-center gap-2">
			<button
				onclick={() => navigateWeek(-1)}
				class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all duration-150 shadow-sm"
			>
				<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15 19l-7-7 7-7" /></svg>
				Previous
			</button>
			{#if !isCurrentWeek()}
				<button
					onclick={goToToday}
					class="px-3.5 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 border border-indigo-200 rounded-xl hover:bg-indigo-100 hover:border-indigo-300 active:bg-indigo-200 transition-all duration-150 shadow-sm"
				>
					Today
				</button>
			{/if}
		</div>
		<button
			onclick={() => navigateWeek(1)}
			class="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100 transition-all duration-150 shadow-sm"
		>
			Next
			<svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" /></svg>
		</button>
	</div>

	<!-- Day grid -->
	<div class="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0">
		<div class="grid grid-cols-7 gap-2 sm:gap-3 min-w-[504px] sm:min-w-0">
			{#each data.dayEntries as day}
				<button
					onclick={() => openDayForm(day.date, day.entry)}
					class="flex flex-col items-center py-3.5 sm:py-4 px-1 rounded-2xl border-2 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
						{day.entry?.daily_total_minutes ? 'bg-indigo-50/70 border-indigo-200 hover:shadow-md hover:border-indigo-300' : 'bg-white border-slate-200 hover:shadow-md hover:border-slate-300'}
						{isToday(day.date) ? 'ring-2 ring-indigo-400' : ''}
						{openDay === day.date ? 'ring-2 ring-indigo-600 border-indigo-400' : ''}"
				>
					<span class="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{DAY_NAMES[day.dayIndex]}</span>
					<span class="text-xl sm:text-2xl font-bold text-slate-900 mt-1">{getDayNumber(day.date)}</span>
					<span
						class="text-xs sm:text-sm font-mono font-semibold mt-2.5 tabular-nums {day.entry?.daily_total_minutes ? 'text-indigo-600' : 'text-slate-300'}"
					>
						{day.entry?.daily_total_minutes ? formatHHMM(day.entry.daily_total_minutes) : '—'}
					</span>
				</button>
			{/each}
		</div>
	</div>

	<!-- Edit panel -->
	{#if openDay}
		<div transition:slide={{ duration: 250 }}>
			<form
				method="POST"
				action="?/upsert"
				use:enhance={() => {
					saving = true;
					return async ({ result, update }) => {
						saving = false;
						if (result.type === 'success') {
							closeDayForm();
						}
						update();
					};
				}}
				class="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 shadow-lg"
			>
				<input type="hidden" name="date" value={openDay} />

				<div class="flex items-center justify-between mb-5">
					<div>
						<h2 class="text-lg font-semibold text-slate-900">{formatLongDate(openDay)}</h2>
					</div>
					<button type="button" onclick={closeDayForm} aria-label="Close" class="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
						<svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
					</button>
				</div>

				<div class="space-y-5">
					<!-- Morning -->
					<div>
						<div class="flex items-center gap-2 mb-3">
							<svg class="w-4 h-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
							<span class="text-sm font-semibold text-slate-700">Morning</span>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="morning_login" class="block text-xs font-medium text-slate-500 mb-1.5">In</label>
								<input
									id="morning_login"
									type="time"
									name="morning_login"
									bind:value={morningLogin}
									class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
								/>
							</div>
							<div>
								<label for="morning_logout" class="block text-xs font-medium text-slate-500 mb-1.5">Out</label>
								<input
									id="morning_logout"
									type="time"
									name="morning_logout"
									bind:value={morningLogout}
									class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
								/>
							</div>
						</div>
					</div>

					<!-- Break -->
					<div>
						<div class="flex items-center gap-2 mb-3">
							<svg class="w-4 h-4 text-sky-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>
							<span class="text-sm font-semibold text-slate-700">Break</span>
						</div>
						<div class="max-w-[160px]">
							<label for="break_duration" class="block text-xs font-medium text-slate-500 mb-1.5">Duration (minutes)</label>
							<input
								id="break_duration"
								type="number"
								name="break_duration"
								bind:value={breakDuration}
								min="0"
								class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
							/>
						</div>
					</div>

					<!-- Noon -->
					<div>
						<div class="flex items-center gap-2 mb-3">
							<svg class="w-4 h-4 text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2"><path stroke-linecap="round" stroke-linejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" /></svg>
							<span class="text-sm font-semibold text-slate-700">Afternoon</span>
						</div>
						<div class="grid grid-cols-2 gap-3">
							<div>
								<label for="noon_login" class="block text-xs font-medium text-slate-500 mb-1.5">In</label>
								<input
									id="noon_login"
									type="time"
									name="noon_login"
									bind:value={noonLogin}
									class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
								/>
							</div>
							<div>
								<label for="noon_logout" class="block text-xs font-medium text-slate-500 mb-1.5">Out</label>
								<input
									id="noon_logout"
									type="time"
									name="noon_logout"
									bind:value={noonLogout}
									class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
								/>
							</div>
						</div>
					</div>
				</div>

				<!-- Footer: total + actions -->
				<div class="mt-6 pt-4 border-t border-slate-100">
					<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
						<div class="flex items-baseline gap-2">
							<span class="text-sm text-slate-500">Daily Total</span>
							<span class="text-xl sm:text-2xl font-bold font-mono text-indigo-600 tabular-nums">{formatHHMM(previewTotal)}</span>
							{#if previewTotal > 0}
								<span class="text-sm font-mono text-emerald-600 tabular-nums">({formatCurrency((previewTotal / 60) * data.hourlyRate)})</span>
							{/if}
						</div>
						<div class="flex items-center gap-2 self-end sm:self-auto">
							<button
								type="button"
								onclick={closeDayForm}
								class="px-4 py-2.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 active:bg-slate-100 transition-colors"
							>
								Cancel
							</button>
							<button
								type="submit"
								disabled={saving}
								class="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800 transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-60 disabled:cursor-not-allowed inline-flex items-center gap-2"
							>
								{#if saving}
									<svg class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4" /><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
									Saving
								{:else}
									Save
								{/if}
							</button>
						</div>
					</div>
				</div>

				{#if form?.message}
					<p class="mt-3 text-sm text-red-500 font-medium">{form.message}</p>
				{/if}
			</form>
		</div>
	{/if}
</div>
