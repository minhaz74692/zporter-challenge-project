'use client';

import Link from 'next/link';
import { useActionState } from 'react';
import { signup, type FormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Field, Input } from '@/components/ui/field';

export default function SignupPage() {
  const [state, action, pending] = useActionState<FormState, FormData>(signup, {});

  return (
    <Card>
      <h1 className="mb-1 text-base font-semibold text-fg">Create a coach account</h1>
      <p className="mb-4 text-xs text-muted">
        Coaches create and launch challenges. Players sign up in the mobile app.
      </p>
      <form action={action} className="space-y-4">
        <Field label="Name">
          <Input name="displayName" required autoComplete="name" placeholder="Coach Carter" />
        </Field>
        <Field label="Email">
          <Input name="email" type="email" required autoComplete="email" />
        </Field>
        <Field label="Password" hint="At least 8 characters">
          <Input name="password" type="password" required minLength={8} autoComplete="new-password" />
        </Field>
        {state.error && <p className="text-xs text-danger">{state.error}</p>}
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? 'Creating…' : 'Create account'}
        </Button>
      </form>
      <p className="mt-4 text-center text-xs text-muted">
        Already have an account?{' '}
        <Link href="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </Card>
  );
}
