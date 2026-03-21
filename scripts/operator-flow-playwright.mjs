import { chromium } from 'playwright';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import { execSync } from 'node:child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const baseUrl = 'http://localhost:3000';
const lang = 'fr';
const docsDir = path.resolve(__dirname, '../public/documents/upload-pack-obf');
const manifestPath = path.join(docsDir, 'manifest.json');
const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf-8'));

const docAdminPdf = path.join(docsDir, manifest.admin_pdf);
const docAdminTxt = path.join(docsDir, manifest.admin_txt);
const docAdminPng = path.join(docsDir, manifest.admin_png);
const docTech = path.join(docsDir, manifest.tech_pdf);
const docFin = path.join(docsDir, manifest.fin_pdf);

for (const p of [manifestPath, docAdminPdf, docAdminTxt, docAdminPng, docTech, docFin]) {
  if (!fs.existsSync(p)) {
    throw new Error(`Missing required file: ${p}`);
  }
}

const results = [];
const step = (name, status, details = '') => {
  results.push({ name, status, details });
  console.log(`[${status}] ${name}${details ? ` -> ${details}` : ''}`);
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext();
const page = await context.newPage();
let lastDialogMessage = '';

function getSoumissionsAccessToken() {
  const cmd = "docker exec soumissions-api-1 python manage.py shell -c \"from django.contrib.auth import get_user_model; from rest_framework_simplejwt.tokens import AccessToken; U=get_user_model(); u,_=U.objects.get_or_create(username='operator_playwright', defaults={'is_active': True}); print(str(AccessToken.for_user(u)))\"";
  const raw = execSync(cmd, { encoding: 'utf-8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  const lines = raw.split(/\r?\n/).map((v) => v.trim()).filter(Boolean);
  const token = lines[lines.length - 1] || '';
  if (!token || token.split('.').length !== 3) {
    throw new Error('Impossible de générer un token JWT valide pour soumissions');
  }
  return token;
}

const accessToken = getSoumissionsAccessToken();

page.on('dialog', async (dialog) => {
  lastDialogMessage = dialog.message();
  await dialog.accept();
});

try {
  await page.goto(`${baseUrl}/${lang}/dashboard/operator/documents`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const uploader = page.locator('input[type="file"]').first();

  await uploader.setInputFiles(docAdminPdf);
  await page.getByText(path.basename(docAdminPdf)).first().waitFor({ timeout: 30000 });

  await uploader.setInputFiles(docAdminTxt);
  await page.getByText(path.basename(docAdminTxt)).first().waitFor({ timeout: 30000 });

  await uploader.setInputFiles(docAdminPng);
  await page.getByText(path.basename(docAdminPng)).first().waitFor({ timeout: 30000 });

  step('Upload obfuscated PDF/TXT/PNG from operator/documents', 'OK', `${path.basename(docAdminPdf)}, ${path.basename(docAdminTxt)}, ${path.basename(docAdminPng)}`);

  await page.goto(`${baseUrl}/${lang}/dashboard/operator/appels-offres`, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const detailsLink = page.locator('a[href*="/dashboard/operator/appels-offres/"]:not([href*="/soumettre"])').first();
  await detailsLink.waitFor({ timeout: 30000 });
  await detailsLink.click();
  await page.waitForURL(/\/dashboard\/operator\/appels-offres\/\d+$/, { timeout: 30000 });

  const soumettreLink = page.locator('a[href*="/dashboard/operator/appels-offres/"][href*="/soumettre"]').first();
  await soumettreLink.waitFor({ timeout: 30000 });
  await soumettreLink.click();
  await page.waitForURL(/\/dashboard\/operator\/appels-offres\/\d+\/soumettre/, { timeout: 30000 });
  step('Open appel and go to soumission page', 'OK');

  await page.getByRole('button', { name: 'Continuer' }).first().click();
  await page.locator('#offre-technique').setInputFiles(docTech);
  await page.locator('#offre-financiere').setInputFiles(docFin);
  await page.getByRole('button', { name: 'Continuer' }).first().click();

  await page.locator('input[type="checkbox"]').first().check({ force: true });
  await page.evaluate((token) => {
    window.localStorage.setItem('access_token', token);
  }, accessToken);
  await page.getByRole('button', { name: "Soumettre l'offre" }).click();
  try {
    await page.waitForURL(new RegExp(`/${lang}/dashboard/operator/soumissions$`), { timeout: 60000 });
    step('Submit soumission with documents', 'OK');
  } catch {
    if (lastDialogMessage) {
      throw new Error(`Soumission bloquee par alerte frontend: ${lastDialogMessage}`);
    }
    throw new Error('Soumission non redirigee vers la liste des soumissions');
  }

  const detailLink = page.locator('a[href*="/dashboard/operator/soumissions/"]').first();
  await detailLink.waitFor({ timeout: 30000 });
  await detailLink.click();
  await page.waitForURL(/\/dashboard\/operator\/soumissions\/\d+/, { timeout: 30000 });
  step('Open soumission detail', 'OK');

  await page.getByRole('button', { name: 'Statut & Évaluation' }).click();
  await page.getByRole('button', { name: /Lancer analyse de conformité/ }).click();

  const successBadge = page.getByText(/Dernier statut IA:/);
  const errorBanner = page.getByText(/Erreur|Aucun document|introuvable/i);

  await Promise.race([
    successBadge.waitFor({ timeout: 45000 }),
    errorBanner.waitFor({ timeout: 45000 }),
  ]);

  if (await successBadge.isVisible()) {
    step('Run IA conformity check from detail', 'OK', 'IA status badge visible');
  } else {
    const msg = await errorBanner.first().innerText();
    step('Run IA conformity check from detail', 'WARN', msg);
  }

  await page.screenshot({ path: path.resolve(__dirname, '../scripts/operator-flow-result.png'), fullPage: true });
  step('Capture end-state screenshot', 'OK', 'scripts/operator-flow-result.png');
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  step('Scenario execution', 'FAIL', message);
  if (!page.isClosed()) {
    await page.screenshot({ path: path.resolve(__dirname, '../scripts/operator-flow-error.png'), fullPage: true });
    step('Capture failure screenshot', 'OK', 'scripts/operator-flow-error.png');
  } else {
    step('Capture failure screenshot', 'WARN', 'page already closed by runtime');
  }
} finally {
  await browser.close();
}

console.log('\n=== SUMMARY ===');
for (const row of results) {
  console.log(`${row.status}\t${row.name}\t${row.details}`);
}

const hasFail = results.some((r) => r.status === 'FAIL');
process.exit(hasFail ? 1 : 0);
