/**
 * Build-time post rendering. Server-only: runs inside server components during
 * `next build`, so neither the MDX compiler nor Shiki is sent to the browser;
 * the page ships plain HTML.
 *
 * - @mdx-js/mdx compiles `.md` (plain Markdown) and `.mdx` posts; remark-gfm adds
 *   GitHub-flavored Markdown (tables, strikethrough, task lists, autolinks).
 * - @shikijs/rehype highlights fenced code. The theme is Shiki's css-variables
 *   theme, so token colors come from --shiki-* tokens in globals.css, defined for
 *   light and dark (all AA) and switched by the normal theme logic.
 */
import "server-only"; // Next resolves this internally; build fails if a client component imports this file.
import { evaluate } from "@mdx-js/mdx";
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import * as runtime from "react/jsx-runtime";
import remarkGfm from "remark-gfm";
import { createCssVariablesTheme } from "shiki/core";
import type { Post } from "@/lib/content";

const codeTheme = createCssVariablesTheme({
  name: "site-tokens",
  variablePrefix: "--shiki-",
  fontStyle: true,
});

const shikiOptions: RehypeShikiOptions = {
  theme: codeTheme,
  // Load only the grammars a post actually uses; unknown languages render as plain text.
  lazy: true,
  // Fences without a language still get Shiki's markup (tabindex, colors).
  defaultLanguage: "text",
  fallbackLanguage: "text",
  addLanguageClass: true,
};

/** Compile a post's body to React elements (server-side only). */
export async function renderPost(post: Post) {
  const { default: Content } = await evaluate(post.body, {
    ...runtime,
    format: post.format,
    development: false,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [[rehypeShiki, shikiOptions]],
  });
  return <Content />;
}
