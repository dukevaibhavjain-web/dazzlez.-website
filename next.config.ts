import { withPayload } from "@payloadcms/next/withPayload";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Storefront config goes here over time (image domains, redirects, etc.)
};

export default withPayload(nextConfig);
