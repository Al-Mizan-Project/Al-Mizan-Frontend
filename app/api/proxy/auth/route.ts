import { NextRequest } from 'next/server';
import { proxyRequest } from '../_utils';

const AUTH_BASE = process.env.NEXT_PUBLIC_AUTH_SERVICE_URL || 'http://localhost:8080';

const options = {
  baseUrl: AUTH_BASE,
  defaultPath: 'users',
  errorLabel: 'AuthProxy',
};

export function GET(req: NextRequest) {
  return proxyRequest(req, 'GET', options);
}

export function POST(req: NextRequest) {
  return proxyRequest(req, 'POST', {
    ...options,
    defaultPath: 'login',
    includeInternalToken: false,
  });
}

export function PATCH(req: NextRequest) {
  return proxyRequest(req, 'PATCH', options);
}

export function PUT(req: NextRequest) {
  return proxyRequest(req, 'PUT', options);
}

export function DELETE(req: NextRequest) {
  return proxyRequest(req, 'DELETE', options);
}
