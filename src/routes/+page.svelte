<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	let { data, form } = $props();

	function formatHHMM(minutes: number): string {
		const h = Math.floor(minutes / 60);
		const m = minutes % 60;
		return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
	}

	function formatCurrency(amount: number): string {
		return '$' + amount.toFixed(4);
	}

	function formatWeekLabel(weekEnding: string): string {
		const end = new Date(weekEnding + 'T12:00:00');
		const start = new Date(end);
		start.setDate(start.getDate() - 6);
		const s = start.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
		const e = end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
		return `${s} – ${e}`;
	}

	function goToWeek(weekEnding: string) {
		goto(`/calendar?week=${weekEnding}`);
	}
</script>

<div class="space-y-6">
	<div class="flex items-center justify-between">
		<div>
			<h1 class="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">Overview</h1>
			<p class="text-sm text-slate-500 mt-1">All your logged weeks</p>
		</div>
		<a
			href="/calendar"
			class="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl hover:from-indigo-600 hover:to-indigo-700 shadow-sm hover:shadow-md transition-all duration-150"
		>
			Go to Calendar
		</a>
	</div>

	<div class="bg-gradient-to-br from-indigo-500 to-indigo-700 rounded-2xl px-6 py-5 shadow-lg shadow-indigo-200/50">
		<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
			<div>
				<p class="text-[11px] font-semibold text-indigo-100 uppercase tracking-widest">Unpaid Hours</p>
				<p class="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">{formatHHMM(data.grandTotalMinutes)}</p>
			</div>
			<div>
				<p class="text-[11px] font-semibold text-indigo-100 uppercase tracking-widest">Unpaid Pay</p>
				<p class="text-2xl sm:text-3xl font-bold font-mono text-white tabular-nums">{formatCurrency(data.grandTotalPay)}</p>
			</div>
		</div>
	</div>

	<div class="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
		<div class="overflow-x-auto">
			<table class="w-full text-sm">
				<thead>
					<tr class="border-b border-slate-100 bg-slate-50/50">
						<th class="text-left px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Week</th>
						<th class="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Hours</th>
						<th class="text-right px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Pay</th>
						<th class="text-center px-5 py-3 font-semibold text-slate-500 text-xs uppercase tracking-wider">Paid</th>
					</tr>
				</thead>
				<tbody>
					{#each data.weeks as week}
						<tr
							onclick={() => goToWeek(week.weekEnding)}
							class="border-b border-slate-50 hover:bg-indigo-50/40 cursor-pointer transition-colors last:border-0 {week.paid ? 'bg-emerald-50/30' : ''}"
						>
							<td class="px-5 py-3.5 font-medium {week.paid ? 'text-slate-400 line-through' : 'text-slate-900'}">
								{formatWeekLabel(week.weekEnding)}
								{#if week.paid}
									<span class="ml-2 inline-flex items-center gap-0.5 text-[10px] font-semibold text-emerald-600 uppercase tracking-wider">Paid</span>
								{/if}
							</td>
							<td class="px-5 py-3.5 text-right font-mono tabular-nums {week.paid ? 'text-slate-300 line-through' : 'text-slate-700'}">{formatHHMM(week.totalMinutes)}</td>
							<td class="px-5 py-3.5 text-right font-mono font-semibold tabular-nums {week.paid ? 'text-slate-300 line-through' : 'text-emerald-600'}">{formatCurrency(week.totalPay)}</td>
							<td class="px-5 py-3.5 text-center" onclick={(e) => e.stopPropagation()}>
								<form method="POST" action="?/toggle_paid" use:enhance>
									<input type="hidden" name="week_ending" value={week.weekEnding} />
									<input type="hidden" name="paid" value={String(!week.paid)} />
									<button
										type="submit"
										class="px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all duration-150 {week.paid ? 'text-slate-500 border-slate-200 bg-white hover:bg-slate-50' : 'text-emerald-700 border-emerald-200 bg-emerald-50 hover:bg-emerald-100'}"
									>
										{week.paid ? 'Unmark' : 'Paid'}
									</button>
								</form>
							</td>
						</tr>
					{:else}
						<tr>
							<td colspan="4" class="px-5 py-10 text-center text-sm text-slate-400">
								No time entries yet.
								<a href="/calendar" class="text-indigo-600 hover:underline font-medium">Start tracking</a>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
		</div>
	</div>
</div>
