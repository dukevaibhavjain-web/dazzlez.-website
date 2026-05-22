"use client";

/**
 * ProductConfigurator — thin client wrapper that owns goldColor state and
 * passes it as props to both ProductGallery and ProductBuyBox so the gallery
 * switches images when the customer picks Yellow / White / Rose Gold.
 *
 * Rendered by the server-component ProductPage. All heavy lifting (pricing
 * fetch, size/carat/engraving) stays inside the individual components.
 */
import { useState } from "react";
import { ProductGallery, type GalleryImage, type GoldColor } from "./ProductGallery";
import { ProductBuyBox } from "./ProductBuyBox";

type MetalOption = { value: string; label: string };

export function ProductConfigurator({
  // Gallery
  images,
  // BuyBox
  code,
  displayName,
  metalOptions,
  isSolitaire,
  isRing,
  initialMetal,
  initialTier,
  defaultGoldColor,
}: {
  images: GalleryImage[];
  code: string;
  displayName: string;
  metalOptions: MetalOption[];
  isSolitaire: boolean;
  isRing: boolean;
  initialMetal?: string;
  initialTier?: string;
  defaultGoldColor: GoldColor;
}) {
  const [goldColor, setGoldColor] = useState<GoldColor>(defaultGoldColor);

  return (
    <div className="grid lg:grid-cols-2 gap-10">
      <ProductGallery images={images} goldColor={goldColor} />
      <ProductBuyBox
        code={code}
        displayName={displayName}
        metalOptions={metalOptions}
        isSolitaire={isSolitaire}
        isRing={isRing}
        initialMetal={initialMetal}
        initialTier={initialTier}
        defaultGoldColor={defaultGoldColor}
        onGoldColorChange={setGoldColor}
      />
    </div>
  );
}
