import { fail, redirect } from '@sveltejs/kit';

export const actions = {
	login: async ({ request, locals: { supabase } }) => {
		const formData = await request.formData();
		const email = formData.get('email') as string;
		const password = formData.get('password') as string;

		const { error } = await supabase.auth.signInWithPassword({ email, password });

		if (error) return fail(400, { message: error.message, success: false });
		throw redirect(303, '/');
	},

	signup: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string) || '';
		const password = (formData.get('password') as string) || '';

		const { error } = await supabase.auth.signUp({ email, password, options: { emailRedirectTo: `${url.origin}/auth/callback` } });

		if (error) {
			if (error.message?.toLowerCase().includes('already registered')) {
				return fail(400, { message: 'Email already registered. Check your inbox for the confirmation link, or resend below.', success: false, email, alreadyRegistered: true });
			}
			return fail(400, { message: error.message, success: false, email: '' });
		}
		return { message: 'Check your email for the confirmation link.', success: true, email, alreadyRegistered: false };
	},

	resend_confirmation: async ({ request, locals: { supabase }, url }) => {
		const formData = await request.formData();
		const email = (formData.get('email') as string) || '';
		if (!email) return fail(400, { message: 'Email is required.', success: false });

		const { error } = await supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: `${url.origin}/auth/callback` } });

		if (error) return fail(400, { message: error.message, success: false });
		return { message: 'Confirmation link resent. Check your email.', success: true };
	}
};
