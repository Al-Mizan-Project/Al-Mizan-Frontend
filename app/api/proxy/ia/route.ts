import { NextRequest } from 'next/server';
import { proxyRequest } from '../_utils';

const IA_BASE = process.env.NEXT_PUBLIC_IA_SERVICE_URL || 'http://localhost:8000';

const options = {
  baseUrl: IA_BASE,
  requirePath: true,
  errorLabel: 'IaProxy',
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
