import Link from "next/link";
import { Suspense } from "react";
import LoginForm from "@/components/auth/LoginForm";
import { dictionary } from "@/lib/i18n";

export default function LoginPage() {
  const t = dictionary.auth;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <Link href="/" className="font-display text-lg tracking-tight">
          HeyTable
        </Link>
        <h1 className="font-display text-2xl tracking-tight">{t.loginTitle}</h1>
        <p className="text-sm text-muted">{t.loginSubtitle}</p>
      </div>
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
