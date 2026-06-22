import { NextRequest } from 'next/server';
import { proxyRequest } from '../_utils';

const IA_BASE = process.env.NEXT_PUBLIC_IA_SERVICE_URL || 'http://localhost:8082';

export const maxDuration = 60;

const options = {
  baseUrl: IA_BASE,
  defaultPath: 'ia',
  errorLabel: 'IAProxy',
};

export function GET(req: NextRequest) {
  return proxyRequest(req, 'GET', options);
}

export function POST(req: NextRequest) {
  return proxyRequest(req, 'POST', options);
}
