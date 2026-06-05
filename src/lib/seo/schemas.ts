/**
 * SEO Schema Builders
 *
 * Exports pure TypeScript functions that return JSON-LD schema objects.
 * No React dependencies. Used by page components to inject structured data.
 *
 * All functions accept `baseUrl` as a parameter for absolute URL generation.
 */

export type BreadcrumbItem = {
  name: string;
  href: string;
};

/**
 * Builds Organization schema with social profiles and contact info.
 * Appears on every page via the root layout.
 */
export function buildOrganizationSchema(baseUrl: string): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "The Dazzlez",
    url: baseUrl,
    logo: `${baseUrl}/logo-square.jpg`,
    image: `${baseUrl}/logo-square.jpg`,
    description: "Handcrafted custom jewelry in 18K gold and diamonds. Made-to-order pieces shipped across India and internationally.",
    sameAs: [
      "https://www.instagram.com/dazzlez.co/",
      "https://www.facebook.com/p/Dazzlez-by-SJ-61555374053460/",
      "https://www.youtube.com/@thedazzlez",
      "https://www.pinterest.com/thedazzlez",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      telephone: "+91-98291-15205",
      contactType: "customer service",
      availableLanguage: ["English", "Hindi"],
      email: "info@dazzlez.co",
    },
  };
}

/**
 * Builds LocalBusiness schema with address, hours, service area.
 * Extends Organization with local business specifics.
 * Appears on every page via the root layout.
 */
export function buildLocalBusinessSchema(baseUrl: string): Record<string, unknown> {
  const organization = buildOrganizationSchema(baseUrl);

  return {
    ...organization,
    "@type": ["LocalBusiness", "JewelryStore"],
    address: {
      "@type": "PostalAddress",
      streetAddress: "Malviya Nagar",
      addressLocality: "Jaipur",
      addressRegion: "Rajasthan",
      postalCode: "302017",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: 26.8505,
      longitude: 75.8069,
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: [
          "Monday",
          "Tuesday",
          "Wednesday",
          "Thursday",
          "Friday",
          "Saturday",
          "Sunday",
        ],
        opens: "10:00",
        closes: "19:00",
      },
    ],
    priceRange: "₹₹₹",
    currenciesAccepted: "INR",
    paymentAccepted: "Cash, Credit Card, UPI",
    areaServed: [
      {
        "@type": "Country",
        name: "India",
      },
      {
        "@type": "AdministrativeArea",
        name: "International",
      },
    ],
  };
}

/**
 * Builds BreadcrumbList schema from breadcrumb items.
 * Used on product pages, category pages, and collection pages.
 */
export function buildBreadcrumbSchema(
  items: BreadcrumbItem[],
  baseUrl: string
): Record<string, unknown> {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: `${baseUrl}${item.href}`,
    })),
  };
}

/**
 * Type for review data from Payload Reviews collection.
 */
export type ReviewData = {
  id: string;
  rating: number;
  authorName: string;
  title?: string;
  body: string;
  reviewDate?: string;
};

/**
 * Type for product data used in review schema.
 */
export type ProductData = {
  displayName: string;
  url: string;
  heroImageUrl: string | null;
  sku: string;
  fromPriceInr: number | null;
  avgRating: number;
  totalReviews: number;
};

/**
 * Builds individual Review objects for a product.
 * Returns an array of Review schema objects to be embedded in Product schema.
 * Each review is a separate schema object with rating, author, and content.
 */
export function buildReviewSchema(
  reviews: ReviewData[],
  product: ProductData
): Record<string, unknown>[] {
  return reviews.map((review) => ({
    "@context": "https://schema.org",
    "@type": "Review",
    reviewRating: {
      "@type": "Rating",
      ratingValue: review.rating,
      bestRating: 5,
      worstRating: 1,
    },
    author: {
      "@type": "Person",
      name: review.authorName,
    },
    reviewBody: review.body,
    name: review.title || `${review.authorName}'s review`,
    datePublished: review.reviewDate || new Date().toISOString(),
  }));
}

/**
 * Builds a complete Product schema with Review array.
 * This wraps individual reviews in a Product schema object.
 * Used on product detail pages.
 */
export function buildProductSchemaWithReviews(
  product: ProductData,
  reviews: ReviewData[]
): Record<string, unknown> {
  const reviewSchemas = buildReviewSchema(reviews, product);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.displayName,
    url: product.url,
    image: product.heroImageUrl || undefined,
    sku: product.sku,
    description: `Handcrafted ${product.displayName} in 18K gold with diamonds. Made-to-order custom jewelry from The Dazzlez.`,
    aggregateRating:
      product.totalReviews > 0
        ? {
            "@type": "AggregateRating",
            ratingValue: product.avgRating,
            bestRating: 5,
            worstRating: 1,
            ratingCount: product.totalReviews,
          }
        : undefined,
    review: reviewSchemas.length > 0 ? reviewSchemas : undefined,
    offers: product.fromPriceInr
      ? {
          "@type": "Offer",
          price: Math.ceil(product.fromPriceInr / 100).toString(),
          priceCurrency: "INR",
          availability: "https://schema.org/PreOrder",
          url: product.url,
        }
      : undefined,
  };
}
