import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { LoginForm } from './login-form';

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next = '' } = await searchParams;

  return (
    <Card>
      <h1 className="mb-4 text-base font-semibold text-fg">Sign in</h1>
      <LoginForm next={next} />
      <p className="mt-4 text-center text-xs text-muted">
        New here?{' '}
        <Link href="/signup" className="text-primary hover:underline">
          Create an account
        </Link>
      </p>
    </Card>
  );
}
