import React from "react";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@payload-config";
import { notFound } from "next/navigation";
import { BlogAnalyticsTracker } from "@/components/blog/BlogAnalyticsTracker";

/**
 * /blog/[slug] — Blog detail page with breadcrumbs, content, related posts, schema
 * Includes analytics event tracking client component
 */

interface BlogDoc {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  body: any; // Lexical JSON
  category: { id: string; name: string; slug: string };
  tags?: Array<{ id: string; name: string; slug: string }>;
  readingTimeMinutes?: number;
  publishedAt: string;
  viewCount: number;
  focusKeyword?: string;
  metaTitle?: string;
  metaDescription?: string;
  linkedProducts?: any[];
  linkedCollections?: any[];
  heroImage?: { url: string; alt: string };
  heroImageSvg?: string;
  abTestSlot?: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  try {
    const payload = await getPayload({ config });

    const blogs = await payload.find({
      collection: "blogs" as any,
      where: { status: { equals: "published" } },
      depth: 0,
      limit: 100,
    });

    return blogs.docs.map((blog: any) => ({
      slug: blog.slug,
    }));
  } catch {
    // Tables may not exist yet on first deploy — fall back to on-demand rendering
    return [];
  }
}

async function generateBlogSchema(blog: BlogDoc) {
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: blog.metaTitle || blog.title,
    description: blog.metaDescription || blog.excerpt,
    datePublished: blog.publishedAt,
    author: {
      "@type": "Organization",
      name: "Dazzlez",
    },
    publisher: {
      "@type": "Organization",
      name: "Dazzlez",
      logo: {
        "@type": "ImageObject",
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/logo.png`,
      },
    },
    keywords: blog.focusKeyword || blog.title,
  };
}

async function generateBreadcrumbSchema(slug: string, title: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: process.env.NEXT_PUBLIC_SITE_URL,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Blog",
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/blog`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: title,
        item: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${slug}`,
      },
    ],
  };
}

function renderLexicalContent(lexicalData: any) {
  if (!lexicalData?.root?.children) {
    return <p>No content</p>;
  }

  const children = lexicalData.root.children;

  return (
    <div
      style={{
        fontSize: "16px",
        lineHeight: 1.8,
        color: "#333",
      }}
    >
      {children.map((node: any, idx: number) => {
        if (node.type === "paragraph") {
          return (
            <p key={idx} style={{ marginBottom: "16px" }}>
              {node.children?.map((text: any, tidx: number) => (
                <span key={tidx}>{text.text}</span>
              )) || ""}
            </p>
          );
        }

        if (node.type === "heading") {
          const level = node.tag || "h2";
          const HeadingTag = level as any;
          const sizes: Record<string, number> = {
            h1: 24,
            h2: 20,
            h3: 18,
            h4: 16,
          };

          return (
            <HeadingTag
              key={idx}
              style={{
                fontSize: `${sizes[level] || 20}px`,
                fontWeight: 700,
                marginTop: "24px",
                marginBottom: "12px",
                color: "#001f3f",
              }}
            >
              {node.children?.map((text: any, tidx: number) => (
                <span key={tidx}>{text.text}</span>
              )) || ""}
            </HeadingTag>
          );
        }

        if (node.type === "list") {
          const ListTag = node.listType === "number" ? "ol" : "ul";
          return (
            <ListTag key={idx} style={{ marginBottom: "16px", paddingLeft: "24px" }}>
              {node.children?.map((item: any, lidx: number) => (
                <li key={lidx} style={{ marginBottom: "8px" }}>
                  {item.children?.map((text: any, tidx: number) => (
                    <span key={tidx}>{text.text}</span>
                  )) || ""}
                </li>
              ))}
            </ListTag>
          );
        }

        if (node.type === "quote") {
          return (
            <blockquote
              key={idx}
              style={{
                borderLeft: "4px solid #D4AF37",
                paddingLeft: "16px",
                marginLeft: 0,
                marginBottom: "16px",
                fontStyle: "italic",
                color: "#666",
              }}
            >
              {node.children?.map((text: any, tidx: number) => (
                <span key={tidx}>{text.text}</span>
              )) || ""}
            </blockquote>
          );
        }

        return null;
      })}
    </div>
  );
}

export async function generateMetadata({ params }: PageProps) {
  try {
    const { slug } = await params;
    const payload = await getPayload({ config });

    const blogs = await payload.find({
      collection: "blogs" as any,
      where: { and: [{ status: { equals: "published" } }, { slug: { equals: slug } }] },
      depth: 1,
      limit: 1,
    });

    if (blogs.docs.length === 0) {
      return { title: "Not Found" };
    }

    const blog = blogs.docs[0] as BlogDoc;

    return {
      title: blog.metaTitle || blog.title,
      description: blog.metaDescription || blog.excerpt,
      openGraph: {
        title: blog.metaTitle || blog.title,
        description: blog.metaDescription || blog.excerpt,
        type: "article",
        publishedTime: blog.publishedAt,
        url: `${process.env.NEXT_PUBLIC_SITE_URL}/blog/${blog.slug}`,
      },
    };
  } catch {
    return { title: "Blog" };
  }
}

export default async function BlogDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const payload = await getPayload({ config });

  const blogs = await payload.find({
    collection: "blogs" as any,
    where: { and: [{ status: { equals: "published" } }, { slug: { equals: slug } }] },
    depth: 2,
    limit: 1,
  });

  if (blogs.docs.length === 0) {
    notFound();
  }

  const blog = blogs.docs[0] as BlogDoc;

  // Fetch related blogs (same category, different post)
  const relatedBlogs = await payload.find({
    collection: "blogs" as any,
    where: {
      and: [
        { status: { equals: "published" } },
        { id: { not_equals: blog.id } },
        { category: { equals: blog.category?.id || blog.category } },
      ],
    },
    limit: 3,
    sort: "-publishedAt",
    depth: 1,
  });

  const blogSchema = await generateBlogSchema(blog);
  const breadcrumbSchema = await generateBreadcrumbSchema(blog.slug, blog.title);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <BlogDetailClient blog={blog} relatedBlogs={relatedBlogs.docs as BlogDoc[]} />
    </>
  );
}

function BlogDetailClient({
  blog,
  relatedBlogs,
}: {
  blog: BlogDoc;
  relatedBlogs: BlogDoc[];
}) {
  return (
    <>
      <BlogAnalyticsTracker slug={blog.slug} title={blog.title} abTestSlot={blog.abTestSlot} />
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Breadcrumbs */}
      <nav
        style={{
          fontSize: "12px",
          color: "#999",
          marginBottom: "24px",
          display: "flex",
          gap: "8px",
        }}
      >
        <Link href="/">
          <span style={{ textDecoration: "none", color: "#666" }}>Home</span>
        </Link>
        <span>/</span>
        <Link href="/blog">
          <span style={{ textDecoration: "none", color: "#666" }}>Blog</span>
        </Link>
        <span>/</span>
        <span style={{ color: "#333", fontWeight: 600 }}>{blog.title}</span>
      </nav>

      {/* Header */}
      <header style={{ marginBottom: "32px" }}>
        {blog.category && (
          <div
            style={{
              fontSize: "11px",
              fontWeight: 700,
              color: "#D4AF37",
              marginBottom: "8px",
              textTransform: "uppercase",
            }}
          >
            {typeof blog.category === "string"
              ? blog.category
              : (blog.category as any).name}
          </div>
        )}

        <h1
          style={{
            fontSize: "36px",
            fontWeight: 700,
            marginBottom: "12px",
            color: "#001f3f",
            lineHeight: 1.2,
          }}
        >
          {blog.title}
        </h1>

        <p
          style={{
            fontSize: "16px",
            color: "#666",
            marginBottom: "16px",
            lineHeight: 1.6,
          }}
        >
          {blog.excerpt}
        </p>

        {/* Meta */}
        <div
          style={{
            fontSize: "13px",
            color: "#999",
            display: "flex",
            gap: "16px",
            alignItems: "center",
            flexWrap: "wrap",
          }}
        >
          {blog.publishedAt && (
            <span>
              Published{" "}
              {new Date(blog.publishedAt).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </span>
          )}
          {blog.readingTimeMinutes && <span>•</span>}
          {blog.readingTimeMinutes && <span>{blog.readingTimeMinutes} min read</span>}
          {blog.viewCount && <span>•</span>}
          {blog.viewCount && <span>{blog.viewCount} views</span>}
        </div>
      </header>

      {/* Hero Image */}
      {(blog.heroImage || blog.heroImageSvg) && (
        <div
          style={{
            width: "100%",
            height: "400px",
            backgroundColor: "#f0f0f0",
            borderRadius: "8px",
            marginBottom: "40px",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {blog.heroImageSvg ? (
            <div dangerouslySetInnerHTML={{ __html: blog.heroImageSvg }} />
          ) : (
            <span style={{ color: "#999", fontSize: "14px" }}>Hero Image</span>
          )}
        </div>
      )}

      {/* Content */}
      {blog.body && (
        <article style={{ marginBottom: "48px" }}>
          {renderLexicalContent(blog.body)}
        </article>
      )}

      {/* Tags */}
      {blog.tags && blog.tags.length > 0 && (
        <div style={{ marginBottom: "40px", paddingTop: "24px", borderTop: "1px solid #eee" }}>
          <p style={{ fontSize: "12px", fontWeight: 600, color: "#666", marginBottom: "8px" }}>
            TAGS
          </p>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {(blog.tags as any[]).map((tag) => (
              <Link
                key={tag.id}
                href={`/blog?tag=${typeof tag === "string" ? tag : tag.slug}`}
              >
                <span
                  style={{
                    padding: "6px 12px",
                    borderRadius: "20px",
                    fontSize: "12px",
                    fontWeight: 600,
                    backgroundColor: "#f0f0f0",
                    textDecoration: "none",
                  }}
                >
                  #{typeof tag === "string" ? tag : tag.name}
                </span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Related Posts */}
      {relatedBlogs.length > 0 && (
        <section style={{ marginTop: "48px", paddingTop: "24px", borderTop: "1px solid #eee" }}>
          <h2
            style={{
              fontSize: "20px",
              fontWeight: 700,
              marginBottom: "20px",
              color: "#001f3f",
            }}
          >
            Related Articles
          </h2>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
              gap: "20px",
            }}
          >
            {relatedBlogs.map((relatedBlog) => (
              <Link key={relatedBlog.id} href={`/blog/${relatedBlog.slug}`}>
                <article
                  style={{
                    backgroundColor: "#f9f9f9",
                    borderRadius: "6px",
                    padding: "16px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                    textDecoration: "none",
                    display: "flex",
                    flexDirection: "column",
                    height: "100%",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#f0f0f0";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.backgroundColor =
                      "#f9f9f9";
                  }}
                >
                  <h3
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      marginBottom: "8px",
                      color: "#001f3f",
                    }}
                  >
                    {relatedBlog.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "12px",
                      color: "#666",
                      marginBottom: "8px",
                      flex: 1,
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden",
                    }}
                  >
                    {relatedBlog.excerpt}
                  </p>
                  <div style={{ fontSize: "11px", color: "#999" }}>
                    {relatedBlog.publishedAt && (
                      <>
                        {new Date(relatedBlog.publishedAt).toLocaleDateString(
                          "en-US",
                          { month: "short", day: "numeric" }
                        )}{" "}
                        •{" "}
                      </>
                    )}
                    {relatedBlog.readingTimeMinutes && (
                      <>{relatedBlog.readingTimeMinutes} min</>
                    )}
                  </div>
                </article>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Back to Blog */}
      <div style={{ marginTop: "40px", paddingTop: "24px", borderTop: "1px solid #eee" }}>
        <Link href="/blog">
          <span
            style={{
              fontSize: "13px",
              fontWeight: 600,
              color: "#0066CC",
              textDecoration: "none",
              cursor: "pointer",
            }}
          >
            ← Back to Blog
          </span>
        </Link>
      </div>
    </div>
    </>
  );
}
