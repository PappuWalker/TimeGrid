<script lang="ts">
	import { enhance } from '$app/forms';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	let { form } = $props();

	let password = $state('');
	let confirm = $state('');

	let mismatch = $derived(password !== confirm);
	let tooShort = $derived(password.length > 0 && password.length < 6);
</script>

{#if $page.data.user}
	<div class="max-w-sm mx-auto mt-12 sm:mt-20">
		<div class="flex flex-col items-center mb-8">
			<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-700 flex items-center justify-center shadow-lg shadow-emerald-200/50 mb-4">
				<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
					<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
				</svg>
			</div>
			<h1 class="text-2xl font-bold text-slate-900">Set new password</h1>
			<p class="text-sm text-slate-500 mt-1 text-center">Enter your new password below</p>
		</div>

		<div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
			<form method="POST" use:enhance class="space-y-4">
				<div>
					<label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">New Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						minlength="6"
						bind:value={password}
						class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
					/>
					{#if tooShort}
						<p class="text-xs text-red-500 mt-1">At least 6 characters</p>
					{/if}
				</div>
				<div>
					<label for="confirm" class="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password</label>
					<input
						id="confirm"
						name="confirm"
						type="password"
						required
						minlength="6"
						bind:value={confirm}
						class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
					/>
					{#if mismatch}
						<p class="text-xs text-red-500 mt-1">Passwords do not match</p>
					{/if}
				</div>

				<button
					type="submit"
					disabled={!password || mismatch || tooShort}
					class="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800 transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
				>
					Update Password
				</button>

				{#if form?.message}
					<p class="text-sm text-red-500 text-center font-medium">{form.message}</p>
				{/if}
			</form>
		</div>
	</div>
{:else}
	<div class="text-center mt-20">
		<p class="text-slate-500">This link is invalid or expired.</p>
		<a href="/auth/forgot-password" class="text-indigo-600 hover:underline mt-2 inline-block">Request a new reset link</a>
	</div>
{/if}
