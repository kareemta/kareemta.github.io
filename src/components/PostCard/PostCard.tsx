import Link from "next/link";
import type { PostMeta } from "@/lib/content";
import { formatDate } from "@/lib/format";
import styles from "./PostCard.module.css";

type PostCardProps = {
  post: PostMeta;
  readingMinutes: number;
};

/** Post in the /writing list: plain "Post" badge + stream label, title link, summary, date and reading time. */
export default function PostCard({ post, readingMinutes }: PostCardProps) {
  return (
    <article className={styles.card}>
      <p className={styles.meta}>
        <span className={styles.badge}>Post</span>
        <span className={styles.stream} aria-hidden="true">
          post.published · {post.date}
        </span>
      </p>
      <h2 className={styles.title}>
        <Link href={`/writing/${post.slug}/`} className={styles.link}>
          {post.title}
        </Link>
      </h2>
      <p className={styles.summary}>{post.summary}</p>
      <p className={styles.footer}>
        <time dateTime={post.date}>{formatDate(post.date)}</time> · {readingMinutes} min read
      </p>
    </article>
  );
}
