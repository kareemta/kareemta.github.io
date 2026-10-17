import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Prose from "@/components/Prose/Prose";
import { getPost, getPublishedPosts, getSite } from "@/lib/content";
import { formatDate } from "@/lib/format";
import { renderPost } from "@/lib/mdx";
import styles from "./page.module.css";

// Only the posts known at build time exist; anything else is a 404.
export const dynamicParams = false;

/**
 * With output: "export", Next fails the build if this returns []. When there are
 * no published posts yet, emit one reserved slug that renders the 404 page.
 * "_empty" can never collide with a real post: post slugs may not contain "_".
 */
const NO_POSTS_SLUG = "_empty";

export function generateStaticParams() {
  const slugs = getPublishedPosts().map((post) => ({ slug: post.slug }));
  return slugs.length > 0 ? slugs : [{ slug: NO_POSTS_SLUG }];
}

/** Published post for this slug, or null (drafts and placeholders don't count). */
function findPost(slug: string) {
  return getPublishedPosts().some((p) => p.slug === slug) ? getPost(slug) : null;
}

export async function generateMetadata({ params }: PageProps<"/writing/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) return {};
  return {
    title: `${post.title} · ${getSite().displayName}`,
    description: post.summary,
  };
}

export default async function PostPage({ params }: PageProps<"/writing/[slug]">) {
  const { slug } = await params;
  const post = findPost(slug);
  if (!post) notFound();

  const content = await renderPost(post);

  return (
    <article className={styles.article}>
      <header className={styles.header}>
        <Link href="/writing/" className={styles.back}>
          ← All writing
        </Link>
        <p className={styles.meta}>
          <span className={styles.badge}>Post</span>
          <span className={styles.stream} aria-hidden="true">
            post.published · {post.date}
          </span>
        </p>
        <h1 className={styles.title}>{post.title}</h1>
        <p className={styles.byline}>
          <time dateTime={post.date}>{formatDate(post.date)}</time> · {post.readingMinutes} min
          read
        </p>
      </header>
      <Prose>{content}</Prose>
    </article>
  );
}
