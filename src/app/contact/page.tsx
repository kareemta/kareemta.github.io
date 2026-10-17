import type { Metadata } from "next";
import ContactLinks from "@/components/ContactLinks/ContactLinks";
import EmptyState from "@/components/EmptyState/EmptyState";
import PageHeader from "@/components/PageHeader/PageHeader";
import { TODO, getResumeUrl, getSite } from "@/lib/content";
import styles from "./page.module.css";

export function generateMetadata(): Metadata {
  return { title: `Contact · ${getSite().displayName}` };
}

export default function ContactPage() {
  const site = getSite();
  // Profile links only; there is deliberately no email (SITE_SPEC.md §8).
  const links = site.contact.links.filter((link) => link.url !== TODO);
  const resumeUrl = getResumeUrl();

  return (
    <>
      <PageHeader title="Contact" topic="contact.*">
        Recruiters, hiring managers and anyone else are welcome to reach out.
      </PageHeader>

      {links.length > 0 ? (
        <ContactLinks links={links} />
      ) : (
        <EmptyState stream="0 links · contact.* idle">Contact links are on their way.</EmptyState>
      )}

      {resumeUrl && (
        <p className={styles.resume}>
          <a href={resumeUrl} download>
            Download resume (PDF)
          </a>
        </p>
      )}
    </>
  );
}
