<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
</script>

<div class="max-w-sm mx-auto mt-12 sm:mt-20">
	<div class="flex flex-col items-center mb-8">
		<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200/50 mb-4">
			<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M15.75 5.25a3 3 0 013 3m3 0a6 6 0 01-7.029 5.912c-.563-.097-1.159.026-1.563.43L10.5 17.25H8.25v2.25H6v2.25H2.25v-2.818c0-.597.237-1.17.659-1.591l6.499-6.499c.404-.404.527-1 .43-1.563A6 6 0 1121.75 8.25z" />
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-slate-900">Reset password</h1>
		<p class="text-sm text-slate-500 mt-1 text-center">Enter your email and we'll send you a reset link</p>
	</div>

	<div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
		<form method="POST" use:enhance class="space-y-4">
			<div>
				<label for="email" class="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
				<input
					id="email"
					name="email"
					type="email"
					required
					class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
					placeholder="you@example.com"
				/>
			</div>

			<button
				type="submit"
				class="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800 transition-all duration-150 shadow-sm hover:shadow-md"
			>
				Send Reset Link
			</button>

			{#if form?.message}
				<p class="text-sm {form.success ? 'text-emerald-600' : 'text-red-500'} text-center font-medium">{form.message}</p>
			{/if}

			<p class="text-sm text-slate-500 text-center pt-2">
				<a href="/auth/login" class="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">Back to sign in</a>
			</p>
		</form>
	</div>
</div>
