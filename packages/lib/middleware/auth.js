import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

/**
 * Use in Admin API routes:
 *   const check = await requireAdmin(request, authOptions);
 *   if (check) return check; // returns 401/403 response if not authorized
 */
export async function requireAdmin(request, authOptions) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  if (session.user.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null; // authorized
}

/**
 * Use in storefront API routes that need any logged-in user.
 */
export async function requireAuth(request, authOptions) {
  const session = await getServerSession(authOptions);
  if (!session) {
    return NextResponse.json({ error: 'Unauthenticated' }, { status: 401 });
  }
  return null;
}

/**
 * Wrap an API handler with try/catch and JSON error response.
 */
export function withErrorHandler(handler) {
  return async function (request, context) {
    try {
      return await handler(request, context);
    } catch (err) {
      console.error('[API Error]', err);
      return NextResponse.json(
        { error: err.message || 'Internal server error' },
        { status: 500 }
      );
    }
  };
}
