import { fail } from '@sveltejs/kit';

export const actions = {
	default: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string) || '';

		if (!email) {
			return fail(400, { message: 'Email is required.', success: false });
		}

		const { error } = await supabase.auth.resetPasswordForEmail(email, {
			redirectTo: `${url.origin}/auth/callback`
		});

		if (error) {
			return fail(400, { message: error.message, success: false });
		}

		return { message: 'Check your email for the reset link.', success: true, email };
	}
};
