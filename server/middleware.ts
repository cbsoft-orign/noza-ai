import { NextResponse, type NextRequest } from 'next/server';

function allowedOrigins() {
  const configuredOrigins = process.env.CORS_ORIGINS
    ?? (process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000,http://127.0.0.1:3000');

  return new Set(configuredOrigins.split(',').map((origin) => origin.trim()).filter(Boolean));
}

function addCorsHeaders(response: NextResponse, origin: string) {
  response.headers.set('Access-Control-Allow-Origin', origin);
  response.headers.set('Access-Control-Allow-Credentials', 'true');
  response.headers.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  response.headers.append('Vary', 'Origin');
  return response;
}

export function middleware(request: NextRequest) {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = origin !== null && allowedOrigins().has(origin);

  if (request.method === 'OPTIONS' && origin !== null) {
    if (!isAllowedOrigin) return new NextResponse(null, { status: 403 });
    return addCorsHeaders(new NextResponse(null, { status: 204 }), origin);
  }

  const response = NextResponse.next();
  return isAllowedOrigin ? addCorsHeaders(response, origin) : response;
}

export const config = {
  matcher: '/api/:path*',
};
