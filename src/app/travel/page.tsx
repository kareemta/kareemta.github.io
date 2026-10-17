import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState/EmptyState";
import PageHeader from "@/components/PageHeader/PageHeader";
import TravelExplorer from "@/components/TravelExplorer/TravelExplorer";
import { getSite, getTravel, publishable } from "@/lib/content";

export function generateMetadata(): Metadata {
  return { title: `Travel · ${getSite().displayName}` };
}

export default function TravelPage() {
  // Placeholder and TODO(user) entries never reach the page. Newest year first.
  const places = publishable(getTravel()).toSorted(
    (a, b) => b.year - a.year || a.name.localeCompare(b.name),
  );

  return (
    <>
      <PageHeader title="Travel" topic="travel.visited">
        Places I&apos;ve been, with the year and one highlight from each.
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
