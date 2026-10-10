import Link from "next/link";
import { createClient } from '@/utils/supabase/server';
import { signout } from '@/app/auth/actions';

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const publicLinks = [
    { href: "/", label: "Home" },
    { href: "/health", label: "Health" },
  ];

  const protectedLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/profile", label: "Profile" },
    { href: "/proposals", label: "Proposals" },
    { href: "/settings", label: "Settings" },
  ];

  const links = user ? [...publicLinks, ...protectedLinks] : publicLinks;

  return (
    <nav className="border-b border-gray-200 bg-[var(--background)]">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between p-4">
        <div className="flex items-center gap-x-5 gap-y-2">
          <span className="font-bold text-[var(--primary)]">ProposalAI</span>
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm text-[var(--muted)] hover:text-[var(--foreground)]">
              {l.label}
            </Link>
          ))}
        </div>
        <div className="flex items-center gap-x-4">
          {user ? (
            <>
              <span className="text-sm text-[var(--muted)]">{user.email}</span>
              <form action={signout}>
                <button type="submit" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
                  Sign out
                </button>
              </form>
            </>
          ) : (
            <Link href="/login" className="text-sm font-medium text-[var(--foreground)] hover:text-[var(--primary)]">
              Login
            </Link>
          )}
        </div>
      </div>
    </nav>
  );
}