import { NextRequest, NextResponse } from 'next/server';

// Rename function to proxy and export as default
export default function proxy(request: NextRequest) {
  const response = NextResponse.next();
  
  // Enforce security headers for webcam access
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('Permissions-Policy', 'camera=self');
  
  return response;
}

// Ensure it only runs on your webcam routes to save performance
export const config = {
  matcher: '/webcam/:path*',
};