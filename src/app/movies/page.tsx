import ReviewTypePage, { reviewTypeMetadata } from "@/components/ReviewTypePage/ReviewTypePage";

export const metadata = reviewTypeMetadata("film");

export default function MoviesPage() {
  return <ReviewTypePage type="film" />;
}
