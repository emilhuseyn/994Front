'use client';

import TopBar from '@/components/TopBar';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CartProvider } from '@/components/CartProvider';
import { WishlistProvider } from '@/components/WishlistProvider';
import { SiteSettingsProvider } from '@/components/SiteSettingsProvider';
import MaintenanceGate from '@/components/MaintenanceGate';
import SeasonalEffects from '@/components/SeasonalEffects';
import { useTheme } from '@/components/ThemeProvider';

export default function StorefrontLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { theme } = useTheme();
  return (
    <SiteSettingsProvider>
      {/* MaintenanceGate has to live INSIDE the settings provider so it can
          read the feature flag.  When the flag is on (and the visitor isn't
          an admin) it short-circuits the whole storefront. */}
      <MaintenanceGate>
        <CartProvider>
          <WishlistProvider>
            {theme.storefront.showAnnouncementBar && <TopBar />}
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            {/* Decorative overlay — seasonal snowflakes etc.  Reads the
                flag itself; renders nothing when the feature is off. */}
            <SeasonalEffects />
          </WishlistProvider>
        </CartProvider>
      </MaintenanceGate>
    </SiteSettingsProvider>
  );
}
