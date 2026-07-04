import { redirect } from '@sveltejs/kit';

export const load = async ({ url, locals: { supabase } }) => {
	const code = url.searchParams.get('code');

	const type = url.searchParams.get('type');

	if (code) {
		await supabase.auth.exchangeCodeForSession(code);
	}

	if (type === 'recovery') {
		throw redirect(303, '/auth/reset-password');
	}

	throw redirect(303, '/');
};
