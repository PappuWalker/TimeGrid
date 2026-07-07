import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { type Handle, redirect } from '@sveltejs/kit';
import { sequence } from '@sveltejs/kit/hooks';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY } from '$env/static/public';

const supabase: Handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_ANON_KEY, {
		cookies: {
			getAll() {
				return event.cookies.getAll();
			},
			setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	event.locals.safeGetSession = async () => {
		const {
			data: { session }
		} = await event.locals.supabase.auth.getSession();
		const {
			data: { user }
		} = await event.locals.supabase.auth.getUser();
		return { session, user };
	};

	return resolve(event, {
		filterSerializedResponseHeaders(name) {
			return name === 'content-range' || name === 'x-supabase-api-version';
		}
	});
};

const authGuard: Handle = async ({ event, resolve }) => {
	const { session, user } = await event.locals.safeGetSession();
	event.locals.session = session;
	event.locals.user = user;

	if (event.url.pathname.startsWith('/auth')) {
		if (user && event.url.pathname === '/auth/logout' && event.request.method === 'POST') {
			return resolve(event);
		}
		if (user && event.url.pathname === '/auth/reset-password') {
			return resolve(event);
		}
		if (event.url.pathname === '/auth/callback') {
			return resolve(event);
		}
		if (user) throw redirect(303, '/');
		return resolve(event);
	}

	if (!user) throw redirect(303, '/auth/login');

	return resolve(event);
};

export const handle: Handle = sequence(supabase, authGuard);
