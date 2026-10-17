/**
 * Build-time post rendering. Server-only: runs inside server components during
 * `next build`, so neither the MDX compiler nor Shiki is sent to the browser;
 * the page ships plain HTML.
 *
 * - @mdx-js/mdx compiles `.md` (plain Markdown) and `.mdx` posts.
 * - @shikijs/rehype highlights fenced code. The theme is Shiki's css-variables
 *   theme, so token colors come from --shiki-* tokens in globals.css, defined for
 *   light and dark (all AA) and switched by the normal theme logic.
 */
import { evaluate } from "@mdx-js/mdx";
import rehypeShiki, { type RehypeShikiOptions } from "@shikijs/rehype";
import * as runtime from "react/jsx-runtime";
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
  fallbackLanguage: "text",
  addLanguageClass: true,
};

/** Compile a post's body to React elements (server-side only). */
export async function renderPost(post: Post) {
  const { default: Content } = await evaluate(post.body, {
    ...runtime,
    format: post.format,
    development: false,
    rehypePlugins: [[rehypeShiki, shikiOptions]],
  });
  return <Content />;
}
