import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || '';

  // Skip the www->bare redirect for API routes so POST bodies aren't dropped
  // when the client follows the 301.
  if (request.nextUrl.pathname.startsWith('/api/')) {
    return NextResponse.next();
  }

  if (host.startsWith('www.')) {
    const url = request.nextUrl.clone();
    url.host = host.replace('www.', '');
    return NextResponse.redirect(url, 301);
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/:path*',
};
