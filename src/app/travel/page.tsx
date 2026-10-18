import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState/EmptyState";
import PageHeader from "@/components/PageHeader/PageHeader";
import TravelExplorer from "@/components/TravelExplorer/TravelExplorer";
import { getSite, getTravel, publishable } from "@/lib/content";

export function generateMetadata(): Metadata {
  return { title: `Travel · ${getSite().displayName}` };
}

export default function TravelPage() {
  // Placeholder and TODO(user) entries never reach the page. Highest rated first
  // (unrated last), then by name.
  const places = publishable(getTravel()).toSorted(
    (a, b) => (b.rating ?? -1) - (a.rating ?? -1) || a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader title="Travel" topic="travel.visited">
        Places I&apos;ve been, each with a score out of 10 and one highlight.
      </PageHeader>
      {places.length > 0 ? (
        <TravelExplorer places={places} />
      ) : (
        <EmptyState stream="0 events · travel.visited idle">
          No places yet. They will show up here, on a globe and in a list, as they are added.
        </EmptyState>
      )}
    </>
  );
}
