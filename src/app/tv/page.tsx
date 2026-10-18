import ReviewTypePage, { reviewTypeMetadata } from "@/components/ReviewTypePage/ReviewTypePage";

export const metadata = reviewTypeMetadata("tv");

export default function TvPage() {
  return <ReviewTypePage type="tv" />;
}
