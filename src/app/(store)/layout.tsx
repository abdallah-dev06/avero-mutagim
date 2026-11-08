import { AnnouncementBar } from "@/components/store/announcement-bar";
import { FloatingWhatsAppButton } from "@/components/store/floating-whatsapp";
import { MobileBottomNav } from "@/components/store/mobile-bottom-nav";
import { SiteFooter } from "@/components/store/site-footer";
import { SiteHeader } from "@/components/store/site-header";
import { getCurrentUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";
import { waMeLink } from "@/lib/whatsapp";
import { getCart } from "@/server/cart";
import { getNavCategories } from "@/server/catalog";

export const dynamic = "force-dynamic";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [settings, categories, cart, user] = await Promise.all([getSettings(), getNavCategories(), getCart(), getCurrentUser()]);
  const signedIn = !!user;
  return (
    <>
      {settings.announcement.enabled && (
        <AnnouncementBar messages={settings.announcement.messages} speed={settings.announcement.speed} />
      )}
      <SiteHeader
        categories={categories}
        cartCount={cart.count}
        wishlistCount={cart.wishlistIds.length}
        signedIn={signedIn}
        instagramUrl={settings.business.instagramUrl}
        whatsappHref={waMeLink(settings.business.whatsappNumber)}
      />
      <main id="main" className="store-main min-h-[60vh]">
        {children}
      </main>
      <SiteFooter settings={settings} categories={categories} />
      <MobileBottomNav cartCount={cart.count} wishlistCount={cart.wishlistIds.length} signedIn={signedIn} />
      <FloatingWhatsAppButton
        phoneNumber={settings.whatsappButton?.phoneNumber || settings.business.whatsappNumber}
        defaultMessage={settings.whatsappButton?.defaultMessage}
        tooltipMessage={settings.whatsappButton?.tooltipMessage}
        showTooltip={settings.whatsappButton?.showTooltip}
        hideOnCheckout={settings.whatsappButton?.hideOnCheckout}
        enabled={settings.whatsappButton?.enabled}
      />
    </>
  );
}
