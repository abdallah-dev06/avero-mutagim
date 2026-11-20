import type { Metadata } from "next";
import { prisma } from "@/lib/db";
import { ReviewsView } from "@/components/store/reviews-view";

export const metadata: Metadata = {
  title: "آراء وتجارب عملائنا | Customer Reviews",
  description: "آراء وتقييمات عملاء AVERO MUTAGIM الحقيقية. شاركنا تجربتك واقرأ آراء عملائنا بكل شفافية ومصداقية.",
  alternates: { canonical: "/reviews" },
};

export const dynamic = "force-dynamic";

export default async function ReviewsPage() {
  const reviews = await prisma.testimonial.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      city: true,
      text: true,
      rating: true,
      createdAt: true,
    },
  });

  return (
    <div className="container-lux py-10 sm:py-14 md:py-20">
      <ReviewsView initialReviews={reviews} />
    </div>
  );
}
