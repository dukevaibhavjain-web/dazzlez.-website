/**
 * TrackingScripts — server component that reads pixel IDs from SiteSettings
 * and injects Meta, GA4, TikTok, and GTM scripts into the page.
 *
 * Configured from Payload admin → Site Settings → Tracking & Pixels tab.
 * Falls back gracefully if SiteSettings are not yet saved.
 */

import Script from "next/script";
import { getPayload } from "payload";
import configPromise from "@payload-config";

type TrackingConfig = {
  metaPixelId?: string;
  ga4MeasurementId?: string;
  tiktokPixelId?: string;
  googleTagManagerId?: string;
};

async function getTrackingConfig(): Promise<TrackingConfig> {
  try {
    const payload = await getPayload({ config: configPromise });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const doc = await (payload as any).findGlobal({ slug: "site-settings" });
    return {
      metaPixelId: doc?.metaPixelId || undefined,
      ga4MeasurementId: doc?.ga4MeasurementId || undefined,
      tiktokPixelId: doc?.tiktokPixelId || undefined,
      googleTagManagerId: doc?.googleTagManagerId || undefined,
    };
  } catch {
    return {};
  }
}

export async function TrackingScripts() {
  const cfg = await getTrackingConfig();

  // Nothing to render if no IDs are configured
  if (
    !cfg.metaPixelId &&
    !cfg.ga4MeasurementId &&
    !cfg.tiktokPixelId &&
    !cfg.googleTagManagerId
  ) {
    return null;
  }

  return (
    <>
      {/* ── Google Tag Manager ─────────────────────────────────────── */}
      {cfg.googleTagManagerId && (
        <>
          <Script id="gtm" strategy="beforeInteractive">
            {`(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${cfg.googleTagManagerId}');`}
          </Script>
          {/* GTM noscript is added to the body by layout */}
        </>
      )}

      {/* ── Google Analytics 4 ────────────────────────────────────── */}
      {cfg.ga4MeasurementId && !cfg.googleTagManagerId && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${cfg.ga4MeasurementId}`}
            strategy="afterInteractive"
          />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${cfg.ga4MeasurementId}');`}
          </Script>
        </>
      )}

      {/* ── Meta (Facebook) Pixel ────────────────────────────────── */}
      {cfg.metaPixelId && !cfg.googleTagManagerId && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s)
{if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};
if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];
s.parentNode.insertBefore(t,s)}(window, document,'script',
'https://connect.facebook.net/en_US/fbevents.js');
fbq('init', '${cfg.metaPixelId}');
fbq('track', 'PageView');`}
        </Script>
      )}

      {/* ── TikTok Pixel ─────────────────────────────────────────── */}
      {cfg.tiktokPixelId && !cfg.googleTagManagerId && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function (w, d, t) {
  w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];
  ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie"],
  ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};
  for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);
  ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},
  ttq.load=function(e,n){var i="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=i,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=document.createElement("script");o.type="text/javascript",o.async=!0,o.src=i+"?sdkid="+e+"&lib="+t;var a=document.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};
  ttq.load('${cfg.tiktokPixelId}');
  ttq.page();
}(window, document, 'ttq');`}
        </Script>
      )}
    </>
  );
}
