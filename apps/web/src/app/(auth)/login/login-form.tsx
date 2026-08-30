'use client';

import { useActionState } from 'react';
import { login, type FormState } from '../actions';
import { Button } from '@/components/ui/button';
import { Field, Input } from '@/components/ui/field';

export function LoginForm({ next }: { next: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(login, {});

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next} />
      <Field label="Email">
        <Input
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue="coach@zporter.test"
        />
      </Field>
      <Field label="Password">
        <Input name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state.error && <p className="text-xs text-danger">{state.error}</p>}
      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? 'Signing in…' : 'Sign in'}
      </Button>
    </form>
  );
}
