import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/fr/validation/dashboard/commission');

  return null;
}