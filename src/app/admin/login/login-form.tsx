"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { adminLogin, type AdminLoginState } from "./actions";

export function LoginForm() {
  const [state, action, pending] = React.useActionState<AdminLoginState, FormData>(adminLogin, undefined);
  return (
    <form action={action} className="space-y-4">
      <Field label="الرقم أو البريد الإلكتروني" htmlFor="identifier" required>
        <Input
          id="identifier"
          name="identifier"
          type="text"
          placeholder="0528982522 أو admin@avero-mutagim.com"
          dir="ltr"
          className="text-right"
          autoComplete="username"
          required
        />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error && (
        <p role="alert" className="rounded-xl bg-rose-50 p-3 text-sm text-danger">
          {state.error}
        </p>
      )}
      <Button type="submit" className="w-full" size="lg" loading={pending}>
        دخول
      </Button>
    </form>
  );
}
