<script lang="ts">
	import { enhance } from '$app/forms';
	let { form } = $props();
	let mode = $state<'login' | 'signup'>('login');
	let pendingEmail = $state('');
	let codeSent = $state(false);

	function switchMode(m: 'login' | 'signup') {
		mode = m;
		codeSent = false;
	}

	$effect(() => {
		if (form?.success && mode === 'signup') {
			pendingEmail = form.email || '';
			codeSent = true;
		}
		if (!form?.success && form?.alreadyRegistered && mode === 'signup') {
			pendingEmail = form.email || '';
			codeSent = true;
		}
	});
</script>

<div class="max-w-sm mx-auto mt-12 sm:mt-20">
	<div class="flex flex-col items-center mb-8">
		<div class="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-lg shadow-indigo-200/50 mb-4">
			<svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
				<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
			</svg>
		</div>
		<h1 class="text-2xl font-bold text-slate-900">Time Grid</h1>
		<p class="text-sm text-slate-500 mt-1">{mode === 'login' ? 'Sign in to your account' : 'Create a new account'}</p>
	</div>

	<div class="bg-white border border-slate-200 rounded-2xl p-6 sm:p-8 shadow-sm">
		{#if codeSent && mode === 'signup'}
			<div class="text-center space-y-4">
				<div class="inline-flex items-center justify-center w-12 h-12 rounded-full bg-emerald-100 mb-2">
					<svg class="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M21.75 9v.906a2.25 2.25 0 01-1.183 1.981l-6.478 3.488M2.25 9v.906a2.25 2.25 0 001.183 1.981l6.478 3.488m8.839 2.51l-4.66-2.51m0 0l-1.023-.55a2.25 2.25 0 00-2.134 0l-1.022.55m0 0l-4.661 2.51m16.5 1.615a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V8.844a2.25 2.25 0 011.183-1.98l7.5-4.04a2.25 2.25 0 012.134 0l7.5 4.04a2.25 2.25 0 011.183 1.98V19.5z" />
					</svg>
				</div>
				<p class="text-sm text-slate-700 font-medium">
					{form?.message || 'Check your email for the confirmation link.'}
				</p>
				<form method="POST" action="?/resend_confirmation" use:enhance>
					<input type="hidden" name="email" value={pendingEmail} />
					<button
						type="submit"
						class="text-sm font-semibold text-indigo-600 hover:text-indigo-700 hover:underline"
					>
						Resend confirmation email
					</button>
				</form>
				<button type="button" onclick={() => { codeSent = false; mode = 'login'; }} class="text-sm text-slate-500 hover:text-slate-700 underline">
					Back to sign in
				</button>
			</div>
		{:else}
			<form
				method="POST"
				action={mode === 'login' ? '?/login' : '?/signup'}
				use:enhance
				class="space-y-4"
			>
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
				<div>
					<label for="password" class="block text-sm font-medium text-slate-700 mb-1.5">Password</label>
					<input
						id="password"
						name="password"
						type="password"
						required
						class="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-400 transition-shadow"
						placeholder="&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;&#8226;"
					/>
				</div>

				{#if mode === 'login'}
					<div class="text-right -mt-2">
						<a href="/auth/forgot-password" class="text-xs text-indigo-600 hover:text-indigo-700 hover:underline font-medium">Forgot password?</a>
					</div>
				{/if}

				<button
					type="submit"
					class="w-full py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-indigo-500 to-indigo-600 rounded-xl hover:from-indigo-600 hover:to-indigo-700 active:from-indigo-700 active:to-indigo-800 transition-all duration-150 shadow-sm hover:shadow-md"
				>
					{mode === 'login' ? 'Sign In' : 'Create Account'}
				</button>

				{#if form?.message && !form?.success}
					<p class="text-sm text-red-500 text-center font-medium">{form.message}</p>
				{/if}

				<p class="text-sm text-slate-500 text-center pt-2">
					{#if mode === 'login'}
						Don't have an account?
						<button type="button" onclick={() => switchMode('signup')} class="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">Sign up</button>
					{:else}
						Already have an account?
						<button type="button" onclick={() => switchMode('login')} class="text-indigo-600 hover:text-indigo-700 font-medium hover:underline">Sign in</button>
					{/if}
				</p>
			</form>
		{/if}
	</div>
</div>
