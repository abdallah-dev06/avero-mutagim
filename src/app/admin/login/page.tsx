import type { Metadata } from "next";
import Image from "next/image";
import { redirect } from "next/navigation";
import { getCurrentUser, isStaff } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata: Metadata = { title: "دخول الإدارة", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLoginPage() {
  if (isStaff(await getCurrentUser())) redirect("/admin");
  return (
    <main id="main" className="grid min-h-dvh place-items-center bg-gradient-to-b from-blush to-ivory px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center text-center">
          <span className="block size-20 overflow-hidden rounded-full ring-1 ring-gold/40">
            <Image src="/brand/logo-round.png" alt="VETRINA BOUTIQUE" width={160} height={160} priority className="size-full object-cover" />
          </span>
          <h1 className="mt-5 text-2xl font-medium text-burgundy">لوحة الإدارة</h1>
          <p className="mt-1 text-sm text-muted">للمصرّح لهم فقط</p>
        </div>
        <div className="rounded-[24px] border border-line bg-white p-6 shadow-[var(--shadow-soft)]">
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
