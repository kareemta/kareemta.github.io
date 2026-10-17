import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState/EmptyState";
import PageHeader from "@/components/PageHeader/PageHeader";
import PostCard from "@/components/PostCard/PostCard";
import { getPost, getPublishedPosts, getSite } from "@/lib/content";
import styles from "./page.module.css";

export function generateMetadata(): Metadata {
  return { title: `Writing · ${getSite().displayName}` };
}

export default function WritingPage() {
  // Drafts, placeholders and TODO(user) entries never reach the page. Newest first.
  const posts = getPublishedPosts();

  return (
    <>
      <PageHeader title="Writing" topic="post.*">
        Posts and notes, newest first.
      </PageHeader>
      {posts.length > 0 ? (
        <ol className={styles.list}>
          {posts.map((post) => (
            <li key={post.slug}>
              <PostCard post={post} readingMinutes={getPost(post.slug).readingMinutes} />
            </li>
          ))}
        </ol>
      ) : (
        <EmptyState stream="0 events · post.* idle">
          No posts yet. They will show up here as they are published.
        </EmptyState>
      )}
    </>
  );
}
