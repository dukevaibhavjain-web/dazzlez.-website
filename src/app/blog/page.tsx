import React from "react";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { redirect } from "next/navigation";

/**
 * /blog — Blog listing page with filtering and pagination
 * Shows published blogs with category/tag filtering, pagination
 */

interface BlogDoc {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  category: { id: string; name: string };
  tags?: Array<{ id: string; name: string }>;
  readingTimeMinutes?: number;
  publishedAt: string;
  viewCount: number;
  focusKeyword?: string;
}

interface PageProps {
  searchParams: Promise<{
    page?: string;
    category?: string;
    tag?: string;
  }>;
}

export const metadata = {
  title: "Blog",
  description: "Insights, tips, and stories about jewelry, gifting, and lab-grown diamonds.",
  openGraph: {
    title: "Blog — Dazzlez",
    description: "Insights, tips, and stories about jewelry, gifting, and lab-grown diamonds.",
    type: "website",
  },
};

export async function generateStaticParams() {
  const payload = await getPayload({ config });

  const categories = await payload.find({
    collection: "blog-categories" as any,
    depth: 0,
    limit: 100,
  });

  const tags = await payload.find({
    collection: "blog-tags" as any,
    depth: 0,
    limit: 100,
  });

  const params: Array<{ category?: string; tag?: string }> = [{}];

  // Category params
  for (const cat of categories.docs) {
    params.push({ category: (cat as any).slug });
  }

  // Tag params
  for (const t of tags.docs) {
    params.push({ tag: (t as any).slug });
  }

  return params;
}

async function generateBlogSchema(blogs: BlogDoc[]) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: "Blog",
    description: "Insights, tips, and stories about jewelry, gifting, and lab-grown diamonds.",
    hasPart: blogs.map((blog) => ({
      "@type": "BlogPosting",
      headline: blog.title,
      description: blog.excerpt,
      datePublished: blog.publishedAt,
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${blog.slug}`,
    })),
  };
}

export default async function BlogPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = parseInt(params.page || "1");
  const categorySlug = params.category;
  const tagSlug = params.tag;

  const payload = await getPayload({ config });

  // Build where clause
  const where: any = {
    and: [{ status: { equals: "published" } }],
  };

  if (categorySlug) {
    const categoryDocs = await payload.find({
      collection: "blog-categories" as any,
      where: { slug: { equals: categorySlug } },
      limit: 1,
      depth: 0,
    });

    if (categoryDocs.docs.length === 0) {
      redirect("/blog");
    }

    const categoryId = (categoryDocs.docs[0] as any).id;
    where.and.push({ category: { equals: categoryId } });
  }

  if (tagSlug) {
    const tagDocs = await payload.find({
      collection: "blog-tags" as any,
      where: { slug: { equals: tagSlug } },
      limit: 1,
      depth: 0,
    });

    if (tagDocs.docs.length === 0) {
      redirect("/blog");
    }

    const tagId = (tagDocs.docs[0] as any).id;
    where.and.push({ tags: { contains: tagId } });
  }

  const BLOGS_PER_PAGE = 12;

  // Fetch blogs with pagination
  const blogs = await payload.find({
    collection: "blogs" as any,
    where,
    limit: BLOGS_PER_PAGE,
    page,
    sort: "-publishedAt",
    depth: 1,
  });

  const blogList = blogs.docs as BlogDoc[];

  // Fetch all categories for filter chips
  const allCategories = await payload.find({
    collection: "blog-categories" as any,
    depth: 0,
    limit: 100,
  });

  // Fetch all tags for filter chips
  const allTags = await payload.find({
    collection: "blog-tags" as any,
    depth: 0,
    limit: 100,
  });

  const schema = await generateBlogSchema(blogList);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />

      <div style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        {/* Header */}
        <div style={{ marginBottom: "40px" }}>
          <h1
            style={{
              fontSize: "32px",
              fontWeight: 700,
              marginBottom: "8px",
              color: "#001f3f",
            }}
          >
            Blog
          </h1>
          <p style={{ fontSize: "16px", color: "#666", marginBottom: "24px" }}>
            Insights, tips, and stories about jewelry, gifting, and lab-grown diamonds.
          </p>

          {/* Filter Chips */}
          <div style={{ marginBottom: "24px" }}>
            <div style={{ marginBottom: "12px" }}>
              <p style={{ fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "8px" }}>
                CATEGORIES
              </p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                <Link href="/blog">
                  <span
                    style={{
                      padding: "6px 12px",
                      borderRadius: "20px",
                      fontSize: "12px",
                      fontWeight: 600,
                      backgroundColor: !categorySlug ? "#001f3f" : "#f0f0f0",
                      color: !categorySlug ? "white" : "#333",
                      cursor: "pointer",
                      textDecoration: "none",
                      display: "inline-block",
                    }}
                  >
                    All
                  </span>
                </Link>

                {(allCategories.docs as any[]).map((cat) => (
                  <Link key={cat.id} href={`/blog?category=${cat.slug}`}>
                    <span
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        fontSize: "12px",
                        fontWeight: 600,
                        backgroundColor:
                          categorySlug === cat.slug ? "#001f3f" : "#f0f0f0",
                        color: categorySlug === cat.slug ? "white" : "#333",
                        cursor: "pointer",
                        textDecoration: "none",
                        display: "inline-block",
                      }}
                    >
                      {cat.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {allTags.docs.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: "12px",
                    fontWeight: 600,
                    color: "#666",
                    marginBottom: "8px",
                  }}
                >
                  TAGS
                </p>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {(allTags.docs as any[]).map((tag) => (
                    <Link key={tag.id} href={`/blog?tag=${tag.slug}`}>
                      <span
                        style={{
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "12px",
                          fontWeight: 600,
                          backgroundColor: tagSlug === tag.slug ? "#D4AF37" : "#f0f0f0",
                          color: tagSlug === tag.slug ? "white" : "#333",
                          cursor: "pointer",
                          textDecoration: "none",
                          display: "inline-block",
                        }}
                      >
                        #{tag.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Blog Grid */}
        {blogList.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px" }}>
            <p style={{ fontSize: "16px", color: "#666" }}>
              No blog posts found. Check back soon!
            </p>
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
                gap: "24px",
                marginBottom: "40px",
              }}
            >
              {blogList.map((blog) => (
                <Link key={blog.id} href={`/blog/${blog.slug}`}>
                  <article
                    style={{
                      backgroundColor: "white",
                      borderRadius: "8px",
                      overflow: "hidden",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
                      transition: "all 0.3s",
                      cursor: "pointer",
                      display: "flex",
                      flexDirection: "column",
                      height: "100%",
                      textDecoration: "none",
                      color: "inherit",
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 8px 24px rgba(0,0,0,0.12)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(-4px)";
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.boxShadow =
                        "0 2px 8px rgba(0,0,0,0.08)";
                      (e.currentTarget as HTMLElement).style.transform = "translateY(0)";
                    }}
                  >
                    {/* Hero placeholder */}
                    <div
                      style={{
                        width: "100%",
                        height: "180px",
                        backgroundColor: "#f0f0f0",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "12px",
                        color: "#999",
                      }}
                    >
                      Hero Image
                    </div>

                    {/* Content */}
                    <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column" }}>
                      {/* Category Badge */}
                      {blog.category && (
                        <span
                          style={{
                            fontSize: "10px",
                            fontWeight: 700,
                            color: "#D4AF37",
                            marginBottom: "8px",
                            textTransform: "uppercase",
                          }}
                        >
                          {typeof blog.category === "string"
                            ? blog.category
                            : (blog.category as any).name}
                        </span>
                      )}

                      {/* Title */}
                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: 700,
                          marginBottom: "8px",
                          color: "#001f3f",
                          lineHeight: 1.3,
                          flex: 1,
                        }}
                      >
                        {blog.title}
                      </h3>

                      {/* Excerpt */}
                      <p
                        style={{
                          fontSize: "13px",
                          color: "#666",
                          marginBottom: "12px",
                          lineHeight: 1.5,
                          display: "-webkit-box",
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: "vertical",
                          overflow: "hidden",
                        }}
                      >
                        {blog.excerpt}
                      </p>

                      {/* Meta */}
                      <div
                        style={{
                          fontSize: "12px",
                          color: "#999",
                          display: "flex",
                          gap: "12px",
                        }}
                      >
                        {blog.publishedAt && (
                          <span>
                            {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                              year: "numeric",
                              month: "short",
                              day: "numeric",
                            })}
                          </span>
                        )}
                        {blog.readingTimeMinutes && (
                          <span>{blog.readingTimeMinutes} min read</span>
                        )}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>

            {/* Pagination */}
            {blogs.totalPages > 1 && (
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  marginTop: "40px",
                }}
              >
                {page > 1 && (
                  <Link href={`/blog?page=${page - 1}${categorySlug ? `&category=${categorySlug}` : ""}${tagSlug ? `&tag=${tagSlug}` : ""}`}>
                    <span
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        backgroundColor: "#f0f0f0",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      ← Previous
                    </span>
                  </Link>
                )}

                {Array.from({ length: blogs.totalPages }, (_, i) => i + 1).map((p) => (
                  <Link
                    key={p}
                    href={`/blog?page=${p}${categorySlug ? `&category=${categorySlug}` : ""}${tagSlug ? `&tag=${tagSlug}` : ""}`}
                  >
                    <span
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        backgroundColor: p === page ? "#001f3f" : "#f0f0f0",
                        color: p === page ? "white" : "#333",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      {p}
                    </span>
                  </Link>
                ))}

                {page < blogs.totalPages && (
                  <Link href={`/blog?page=${page + 1}${categorySlug ? `&category=${categorySlug}` : ""}${tagSlug ? `&tag=${tagSlug}` : ""}`}>
                    <span
                      style={{
                        padding: "8px 12px",
                        borderRadius: "4px",
                        backgroundColor: "#f0f0f0",
                        fontSize: "12px",
                        fontWeight: 600,
                        cursor: "pointer",
                      }}
                    >
                      Next →
                    </span>
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
