import Image from "next/image";
import Link from "next/link";
import type { SiteSettings } from "@/lib/settings-schema";
import { displayPhone } from "@/lib/phone";
import { waMeLink } from "@/lib/whatsapp";
import { FacebookIcon, InstagramIcon, WhatsAppIcon } from "@/components/store/social-icons";

export function SiteFooter({ settings, categories }: { settings: SiteSettings; categories: { slug: string; name: string }[] }) {
  const b = settings.business;
  return (
    <footer className="relative overflow-hidden bg-burgundy text-ivory">
      <div aria-hidden className="pointer-events-none absolute -left-24 -top-24 size-80 rounded-full border border-gold/20" />
      <div aria-hidden className="pointer-events-none absolute -left-10 -top-10 size-80 rounded-full border border-gold/10" />
      <div className="container-lux relative grid gap-10 py-14 md:grid-cols-12 md:py-20">
        <div className="md:col-span-4">
          <div className="flex items-center gap-3">
            <span className="block size-16 overflow-hidden rounded-full ring-1 ring-gold/40">
              <Image src="/brand/logo-round.png" alt="شعار VETRINA BOUTIQUE" width={128} height={128} className="size-full object-cover" />
            </span>
            <span className="latin leading-none">
              <span className="block font-display text-2xl tracking-[0.22em]">VETRINA</span>
              <span className="mt-1.5 block text-[0.65rem] tracking-[0.5em] text-dusty">BOUTIQUE</span>
            </span>
          </div>
          <p className="mt-6 max-w-sm leading-relaxed text-ivory/75">{settings.footer.about}</p>
          <div className="mt-6 flex gap-2">
            {b.instagramUrl && (
              <a href={b.instagramUrl} target="_blank" rel="noopener noreferrer" aria-label="إنستغرام" className="grid size-11 place-items-center rounded-full border border-ivory/20 transition hover:border-dusty hover:bg-ivory/5">
                <InstagramIcon className="size-5" />
              </a>
            )}
            {b.facebookUrl && (
              <a href={b.facebookUrl} target="_blank" rel="noopener noreferrer" aria-label="فيسبوك" className="grid size-11 place-items-center rounded-full border border-ivory/20 transition hover:border-dusty hover:bg-ivory/5">
                <FacebookIcon className="size-5" />
              </a>
            )}
            {b.whatsappNumber && (
              <a href={waMeLink(b.whatsappNumber)} target="_blank" rel="noopener noreferrer" aria-label="واتساب" className="grid size-11 place-items-center rounded-full border border-ivory/20 transition hover:border-dusty hover:bg-ivory/5">
                <WhatsAppIcon className="size-5" />
              </a>
            )}
          </div>
        </div>

        <FooterCol title="تسوّقي" className="md:col-span-2">
          <FooterLink href="/shop?sort=new">وصل حديثاً</FooterLink>
          <FooterLink href="/shop?sort=best">الأكثر مبيعاً</FooterLink>
          {categories.slice(0, 5).map((c) => (
            <FooterLink key={c.slug} href={`/category/${c.slug}`}>
              {c.name}
            </FooterLink>
          ))}
        </FooterCol>
        <FooterCol title="المساعدة" className="md:col-span-3">
          <FooterLink href="/size-guide">دليل المقاسات</FooterLink>
          <FooterLink href="/track">تتبّع طلبك</FooterLink>
          <FooterLink href="/policies">التوصيل والاستبدال</FooterLink>
        </FooterCol>
        <FooterCol title="تواصلي معنا" className="md:col-span-3">
          {b.whatsappNumber && (
            <a href={waMeLink(b.whatsappNumber)} target="_blank" rel="noopener noreferrer" className="block py-1.5 text-ivory/80 transition hover:text-ivory">
              واتساب: <span className="latin inline-block">{displayPhone(b.whatsappNumber)}</span>
            </a>
          )}
          {b.email && (
            <a href={`mailto:${b.email}`} className="block py-1.5 text-ivory/80 hover:text-ivory">
              {b.email}
            </a>
          )}
          {b.address && <p className="py-1.5 text-ivory/80">{b.address}</p>}
          {b.hours && <p className="py-1.5 text-ivory/80">{b.hours}</p>}
          <p className="mt-3 inline-flex rounded-full border border-dusty/40 px-3 py-1.5 text-sm text-dusty">{settings.shipping.message}</p>
        </FooterCol>
      </div>
      <div className="border-t border-ivory/15 bg-burgundy/80">
        <div className="container-lux flex flex-col items-center justify-between gap-4 py-7 text-center sm:flex-row sm:text-start">
          <div>
            <p className="text-base font-bold tracking-wide text-dusty sm:text-lg">
              تصميم وتطوير وبرمجة: المهندس عبد الله © {new Date().getFullYear()}
            </p>
            <p className="mt-1 text-xs text-ivory/60">
              جميع الحقوق محفوظة · {b.name}
            </p>
          </div>
          <div className="text-xs text-ivory/60">
            <p>الدفع عند الاستلام · أسعار بالشيكل (₪)</p>
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={className}>
      <h3 className="mb-4 text-sm font-bold tracking-wide text-dusty">{title}</h3>
      <div className="flex flex-col">{children}</div>
    </div>
  );
}

function FooterLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="w-fit py-1.5 text-ivory/80 transition hover:text-ivory">
      {children}
    </Link>
  );
}
