import Link from "next/link";

const links = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/proposals", label: "Proposals" },
  { href: "/settings", label: "Settings" },
  { href: "/login", label: "Login" },
  { href: "/health", label: "Health" },
];

export default function Navbar() {
  return (
    <nav className="border-b border-gray-200">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-5 gap-y-2 p-4">
        <span className="font-bold text-primary">ProposalAI</span>
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="text-sm text-muted hover:text-foreground">
            {l.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}