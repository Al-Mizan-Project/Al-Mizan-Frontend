import { NextRequest } from 'next/server';
import { proxyRequest } from '../_utils';

const RECOURS_BASE = process.env.NEXT_PUBLIC_CONTRACTANT_SERVICE_URL || 'http://localhost:8000';

const options = {
  baseUrl: RECOURS_BASE,
  defaultPath: 'api/recours/',
  errorLabel: 'RecoursProxy',
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
