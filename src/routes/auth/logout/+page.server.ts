import { redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ cookies, locals: { supabase } }) => {
		await supabase.auth.signOut();

		const all = cookies.getAll();
		for (const c of all) {
			if (c.name.startsWith('sb-')) {
				cookies.set(c.name, '', { path: '/', maxAge: 0 });
			}
		}

		throw redirect(303, '/auth/login');
	}
};
