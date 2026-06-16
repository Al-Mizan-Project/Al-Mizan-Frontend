import { NextRequest } from 'next/server';
import { proxyRequest } from '../_utils';

const NOTIFICATIONS_BASE = process.env.NEXT_PUBLIC_NOTIFICATIONS_SERVICE_URL || 'http://localhost:8000';

const options = {
  baseUrl: NOTIFICATIONS_BASE,
  defaultPath: 'notifications',
  errorLabel: 'NotificationsProxy',
};

export function GET(req: NextRequest) {
  return proxyRequest(req, 'GET', options);
}

export function POST(req: NextRequest) {
  return proxyRequest(req, 'POST', options);
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
