import { getSite } from "@/lib/content";

export default function Home() {
  const site = getSite();
  return (
    <main>
      <h1>{site.displayName}</h1>
      <p>{site.headline}</p>
      <p>{site.tagline}</p>
    </main>
  );
}
