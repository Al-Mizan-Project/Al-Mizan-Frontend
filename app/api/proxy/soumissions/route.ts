import { NextRequest } from 'next/server';
import { proxyRequest } from '../_utils';

const SOUMISSIONS_BASE = process.env.NEXT_PUBLIC_SOUMISSIONS_SERVICE_URL || 'http://localhost:8000';

// Allow up to 3 minutes for OCR-heavy conformity analysis
export const maxDuration = 180;

const options = {
  baseUrl: SOUMISSIONS_BASE,
  defaultPath: 'soumissions',
  errorLabel: 'SoumissionsProxy',
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
