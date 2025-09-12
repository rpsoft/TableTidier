import { NextResponse } from 'next/server';
import { auth } from './ui/src/auth';

export async function middleware(request) {
  const session = await auth();
  
  // Allow access to auth pages and API routes
  if (request.nextUrl.pathname.startsWith('/auth') || 
      request.nextUrl.pathname.startsWith('/api') ||
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname === '/') {
    return NextResponse.next();
  }
  
  // Redirect unauthenticated users to sign in
  if (!session?.user?.email) {
    return NextResponse.redirect(new URL('/auth/signin', request.url));
  }
  
  return NextResponse.next();
}
   
  export const config = {
    matcher: ['/((?!api|_next/static|_next/image|.*\\.png$).*)'],
  }