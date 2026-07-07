<script lang="ts">
	import '../app.css';
	import { enhance } from '$app/forms';
	import { page } from '$app/stores';
	let { children, data } = $props();
</script>

<div class="min-h-screen bg-slate-50">
	<header class="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
		<div class="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
			<a href="/" class="flex items-center gap-2.5 group">
				<div class="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-indigo-700 flex items-center justify-center shadow-sm transition-transform group-hover:scale-105">
					<svg class="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
						<path stroke-linecap="round" stroke-linejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
					</svg>
				</div>
				<span class="text-lg font-semibold text-slate-900">Time Grid</span>
			</a>
			{#if data.user}
				<nav class="hidden sm:flex items-center gap-1">
					<a
						href="/"
						class="px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors {$page.url.pathname === '/' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}"
					>Home</a>
					<a
						href="/calendar"
						class="px-3.5 py-1.5 text-sm font-medium rounded-lg transition-colors {$page.url.pathname.startsWith('/calendar') ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-100'}"
					>Calendar</a>
				</nav>
				<div class="flex items-center gap-3">
					<div class="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center ring-2 ring-white">
						<span class="text-xs font-semibold text-indigo-600">{data.user.email?.charAt(0).toUpperCase()}</span>
					</div>
					<form method="POST" action="/auth/logout" use:enhance>
						<button type="submit" class="text-sm font-medium text-slate-500 hover:text-slate-700 transition-colors px-3 py-1.5 rounded-lg hover:bg-slate-100">Sign out</button>
					</form>
				</div>
			{/if}
		</div>
	</header>
	<main class="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
		{@render children()}
	</main>
</div>
