import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../src/generated/prisma/client";

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

async function main() {
  console.log("=== ZEROING OUT EVERYTHING (100% REALISTIC RESET) ===");

  // 1. Delete all cart items and wishlist items
  const deletedCart = await prisma.cartItem.deleteMany({});
  console.log(`✓ Deleted ${deletedCart.count} cart items`);

  const deletedWishlist = await prisma.wishlistItem.deleteMany({});
  console.log(`✓ Deleted ${deletedWishlist.count} wishlist items`);

  // 2. Delete all order items, events, and orders
  const deletedOrderEvents = await prisma.orderEvent.deleteMany({});
  console.log(`✓ Deleted ${deletedOrderEvents.count} order events`);

  const deletedOrderItems = await prisma.orderItem.deleteMany({});
  console.log(`✓ Deleted ${deletedOrderItems.count} order items`);

  const deletedOrders = await prisma.order.deleteMany({});
  console.log(`✓ Deleted ${deletedOrders.count} orders`);

  // 3. Delete all stock movements, variants, images, colors, products
  const deletedStock = await prisma.stockMovement.deleteMany({});
  console.log(`✓ Deleted ${deletedStock.count} stock movements`);

  const deletedVariants = await prisma.productVariant.deleteMany({});
  console.log(`✓ Deleted ${deletedVariants.count} product variants`);

  const deletedImages = await prisma.productImage.deleteMany({});
  console.log(`✓ Deleted ${deletedImages.count} product images`);

  const deletedColors = await prisma.productColor.deleteMany({});
  console.log(`✓ Deleted ${deletedColors.count} product colors`);

  const deletedProducts = await prisma.product.deleteMany({});
  console.log(`✓ Deleted ${deletedProducts.count} products`);

  // 4. Delete all categories and collections
  const deletedCollections = await prisma.collection.deleteMany({});
  console.log(`✓ Deleted ${deletedCollections.count} collections`);

  const deletedCategories = await prisma.category.deleteMany({});
  console.log(`✓ Deleted ${deletedCategories.count} categories`);

  // 5. Delete all fake testimonials / reviews
  const deletedTestimonials = await prisma.testimonial.deleteMany({});
  console.log(`✓ Deleted ${deletedTestimonials.count} testimonials (zero fake reviews)`);

  // Verify counts
  const [prodCount, catCount, revCount, ordCount] = await Promise.all([
    prisma.product.count(),
    prisma.category.count(),
    prisma.testimonial.count(),
    prisma.order.count(),
  ]);

  console.log("\n=== VERIFICATION SUMMARY ===");
  console.log(`Products: ${prodCount}`);
  console.log(`Categories: ${catCount}`);
  console.log(`Testimonials: ${revCount}`);
  console.log(`Orders: ${ordCount}`);
  console.log("✓ Zeroed out successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
