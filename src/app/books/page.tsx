import ReviewTypePage, { reviewTypeMetadata } from "@/components/ReviewTypePage/ReviewTypePage";

export const metadata = reviewTypeMetadata("book");

export default function BooksPage() {
  return <ReviewTypePage type="book" />;
}
