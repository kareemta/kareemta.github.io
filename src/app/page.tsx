import { getSite } from "@/lib/content";
import ThemeToggle from "@/components/ThemeToggle/ThemeToggle";

export default function Home() {
  const site = getSite();
  return (
    <main>
      <h1>{site.displayName}</h1>
      <p>{site.headline}</p>
      <p>{site.tagline}</p>
      {/* Temporary: moves into the site footer in task 2.2. */}
      <ThemeToggle />
    </main>
  );
}
