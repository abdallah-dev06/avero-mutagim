"use client";

import Link from "next/link";
import * as React from "react";
import { customerLogin, customerRegister, type AuthState } from "./actions";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";

function SubmitButton({ children, pending }: { children: React.ReactNode; pending: boolean }) {
  return (
    <Button type="submit" className="w-full" size="lg" loading={pending}>
      {children}
    </Button>
  );
}

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = React.useActionState<AuthState, FormData>(customerLogin, undefined);
  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <Field label="البريد الإلكتروني" htmlFor="email" required>
        <Input id="email" name="email" type="email" dir="ltr" className="text-right" autoComplete="email" required />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" required>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </Field>
      {state?.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton pending={pending}>تسجيل الدخول</SubmitButton>
      <p className="text-center text-sm text-muted">
        ليس لديك حساب؟{" "}
        <Link href="/account/register" className="text-burgundy underline-offset-4 hover:underline">
          أنشئي حساباً
        </Link>
      </p>
    </form>
  );
}

export function RegisterForm() {
  const [state, action, pending] = React.useActionState<AuthState, FormData>(customerRegister, undefined);
  const fe = state?.fieldErrors ?? {};
  return (
    <form action={action} className="space-y-4">
      <Field label="الاسم" htmlFor="name" error={fe.name} required>
        <Input id="name" name="name" autoComplete="name" required />
      </Field>
      <Field label="البريد الإلكتروني" htmlFor="email" error={fe.email} required>
        <Input id="email" name="email" type="email" dir="ltr" className="text-right" autoComplete="email" required />
      </Field>
      <Field label="رقم الهاتف (اختياري)" htmlFor="phone" error={fe.phone}>
        <Input id="phone" name="phone" type="tel" dir="ltr" className="text-right" autoComplete="tel" />
      </Field>
      <Field label="كلمة المرور" htmlFor="password" error={fe.password} hint="8 أحرف على الأقل" required>
        <Input id="password" name="password" type="password" autoComplete="new-password" minLength={8} required />
      </Field>
      {state?.error && !Object.keys(fe).length && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <SubmitButton pending={pending}>إنشاء الحساب</SubmitButton>
      <p className="text-center text-sm text-muted">
        لديك حساب؟{" "}
        <Link href="/account/login" className="text-burgundy underline-offset-4 hover:underline">
          سجّلي الدخول
        </Link>
      </p>
    </form>
  );
}
