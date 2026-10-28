import Link from "next/link";
import { getUser } from "@/lib/require-user";

const features = [
  {
    title: "Rich-text editing",
    description: "Headings, bold and italic text, lists, inline code and code blocks. Just enough formatting, nothing in your way.",
  },
  {
    title: "Autosave",
    description: "Your changes save automatically a moment after you stop typing, with a clear status so you always know where you stand.",
  },
  {
    title: "Private by default",
    description: "Every note starts private. Only you can see it until you decide otherwise.",
  },
  {
    title: "Share with a link",
    description: "Make a note public to get an unguessable link. Turn sharing off at any time and the old link stops working.",
  },
  {
    title: "Secure accounts",
    description: "Email and password sign-in, with every note scoped to its owner on the server.",
  },
  {
    title: "Fast and simple",
    description: "A focused, server-rendered app that loads quickly and stays out of your way.",
  },
];

const steps = [
  { title: "Write", description: "Create a note and start typing." },
  { title: "Autosave", description: "Changes are saved as you go." },
  { title: "Share", description: "Publish a link when you're ready, or keep it to yourself." },
];

const primaryLink =
  "rounded-md bg-foreground px-5 py-2.5 text-sm font-medium text-background hover:opacity-90";
const secondaryLink =
  "rounded-md border border-foreground/20 px-5 py-2.5 text-sm font-medium hover:bg-foreground/5";

export default async function HomePage() {
  const user = await getUser();

  return (
    <>
      <header className="flex items-center justify-between px-6 py-4">
        <span className="font-semibold">Notes</span>
        <nav aria-label="Account" className="flex gap-4 text-sm">
          {user ? (
            <Link href="/dashboard" className="font-medium hover:underline">
              Dashboard
            </Link>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Log in
              </Link>
              <Link href="/register" className="font-medium hover:underline">
                Sign up
              </Link>
            </>
          )}
        </nav>
      </header>

      <main>
        <section className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-20 text-center sm:py-28">
          <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
            Write it down. Share it when you want to.
          </h1>
          <p className="max-w-xl text-lg text-pretty text-foreground/70">
            Notes is a simple place for rich-text notes that save themselves. Keep them private, or
            share any note with a single link.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {user ? (
              <Link href="/dashboard" className={primaryLink}>
                Go to dashboard
              </Link>
            ) : (
              <>
                <Link href="/register" className={primaryLink}>
                  Create a free account
                </Link>
                <Link href="/login" className={secondaryLink}>
                  Log in
                </Link>
              </>
            )}
          </div>
        </section>

        <section aria-labelledby="features-heading" className="border-t border-foreground/10 px-6 py-20">
          <div className="mx-auto max-w-5xl">
            <h2 id="features-heading" className="text-center text-2xl font-semibold sm:text-3xl">
              Everything you need, nothing you don&apos;t
            </h2>
            <ul className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ title, description }) => (
                <li key={title} className="rounded-xl border border-foreground/10 p-6">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="mt-2 text-sm text-foreground/70">{description}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section aria-labelledby="how-heading" className="border-t border-foreground/10 px-6 py-20">
          <div className="mx-auto max-w-4xl">
            <h2 id="how-heading" className="text-center text-2xl font-semibold sm:text-3xl">
              How it works
            </h2>
            <ol className="mt-12 grid gap-8 sm:grid-cols-3">
              {steps.map(({ title, description }, index) => (
                <li key={title} className="flex flex-col items-center gap-3 text-center">
                  <span
                    aria-hidden="true"
                    className="flex size-10 items-center justify-center rounded-full bg-foreground font-semibold text-background"
                  >
                    {index + 1}
                  </span>
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-foreground/70">{description}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>
      </main>

      <footer className="border-t border-foreground/10 px-6 py-8 text-center text-sm text-foreground/60">
        © {new Date().getFullYear()} Notes
      </footer>
    </>
  );
}
