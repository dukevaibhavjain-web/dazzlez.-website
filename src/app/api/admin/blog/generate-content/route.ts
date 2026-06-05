/**
 * POST /api/admin/blog/generate-content
 *
 * Generate full blog post from approved keyword
 * Admin-only endpoint
 */

import { getPayload } from "payload";
import config from "@payload-config";
import {
  generateOutline,
  generateFullPost,
  resolveLinkedProducts,
  resolveLinkedCollections,
} from "@/lib/blog/contentGeneration";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: req.headers });

    // Admin-only
    if (!user) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { keywordId, blogId } = await req.json();

    if (!keywordId) {
      return Response.json({ error: "keywordId required" }, { status: 400 });
    }

    // Step 1: Fetch keyword
    const keyword = await payload.findByID({
      collection: "keyword-bank" as any,
      id: keywordId,
      depth: 1,
    });

    if (!keyword) {
      return Response.json({ error: "Keyword not found" }, { status: 404 });
    }

    const keywordText = (keyword as any).keyword as string;
    const relatedCategory = (keyword as any).relatedCategory as any;
    const categoryName = relatedCategory?.name || "General";

    console.log(`[generate-content] Generating content for keyword: "${keywordText}"`);

    // Step 2: Fetch products for context
    const products = await payload.find({
      collection: "products",
      limit: 200,
      depth: 1,
      select: {
        code: true,
        displayName: true,
        category: true,
        fromPriceInr: true,
      },
    });

    const productSummaries = products.docs.map((p: any) => ({
      code: p.code,
      displayName: p.displayName,
      category: p.category,
      fromPriceInr: p.fromPriceInr,
    }));

    console.log(`[generate-content] Got ${productSummaries.length} products for context`);

    // Step 3: Generate outline
    const outline = await generateOutline(keywordText, categoryName);
    console.log(`[generate-content] Generated outline: "${outline.title}"`);

    // Step 4: Generate full post
    const generatedPost = await generateFullPost(outline, productSummaries);
    console.log(`[generate-content] Generated post: ${generatedPost.title}`);

    // Step 5: Resolve product and collection IDs
    const linkedProductIds = await resolveLinkedProducts(
      generatedPost.linkedProductCodes,
      payload
    );
    const linkedCollectionIds = await resolveLinkedCollections(
      generatedPost.linkedCollectionSlugs,
      payload
    );

    console.log(
      `[generate-content] Resolved ${linkedProductIds.length} products, ${linkedCollectionIds.length} collections`
    );

    // Step 6: Create or update blog document
    const blogData = {
      title: generatedPost.title,
      slug: generatedPost.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-|-$/g, ""),
      excerpt: generatedPost.excerpt,
      body: generatedPost.body,
      status: "draft",
      category: relatedCategory?.id || null,
      linkedProducts: linkedProductIds,
      linkedCollections: linkedCollectionIds,
      metaTitle: generatedPost.title,
      metaDescription: generatedPost.metaDescription,
      focusKeyword: generatedPost.focusKeyword,
      aiGenerationMeta: {
        model: "claude-3-5-sonnet-20241022",
        keyword: keywordText,
        timestamp: new Date().toISOString(),
      },
    };

    let createdBlog;

    if (blogId) {
      // Update existing blog
      createdBlog = await payload.update({
        collection: "blogs" as any,
        id: blogId,
        data: blogData,
      });
      console.log(`[generate-content] Updated blog: ${blogId}`);
    } else {
      // Create new blog
      createdBlog = await payload.create({
        collection: "blogs" as any,
        data: blogData,
        overrideAccess: true,
      });
      console.log(`[generate-content] Created blog: ${createdBlog.id}`);
    }

    // Step 7: Mark keyword as used
    await payload.update({
      collection: "keyword-bank" as any,
      id: keywordId,
      data: {
        blogUsed: (createdBlog as any).id,
      },
      overrideAccess: true,
    });

    return Response.json({
      ok: true,
      blogId: (createdBlog as any).id,
      title: generatedPost.title,
      wordCount: generatedPost.body.root.children.length * 100, // Rough estimate
      linkedProducts: linkedProductIds.length,
      linkedCollections: linkedCollectionIds.length,
    });
  } catch (error) {
    console.error("[generate-content] Error:", error);
    return Response.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
