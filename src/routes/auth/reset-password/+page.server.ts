import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals: { supabase, user } }) => {
		if (!user) throw redirect(303, '/auth/login');

		const formData = await request.formData();
		const password = (formData.get('password') as string) || '';

		if (!password || password.length < 6) {
			return fail(400, { message: 'Password must be at least 6 characters.', success: false });
		}

		const { error } = await supabase.auth.updateUser({ password });

		if (error) {
			return fail(400, { message: error.message, success: false });
		}

		throw redirect(303, '/');
	}
};
