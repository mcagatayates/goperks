import Link from "next/link";
import SignupForm from "@/components/auth/SignupForm";
import { dictionary } from "@/lib/i18n";

export default function SignupPage() {
  const t = dictionary.auth;
  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-8 px-6 py-16">
      <div className="flex flex-col gap-2">
        <Link href="/" className="font-display text-lg tracking-tight">
          HeyTable
        </Link>
        <h1 className="font-display text-2xl tracking-tight">{t.signupTitle}</h1>
        <p className="text-sm text-muted">{t.signupSubtitle}</p>
      </div>
      <SignupForm />
    </main>
  );
}
