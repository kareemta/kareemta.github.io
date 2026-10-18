import type { Metadata } from "next";
import { pageMetadata } from "@/lib/metadata";
import ExperienceTimeline from "@/components/ExperienceTimeline/ExperienceTimeline";
import PageHeader from "@/components/PageHeader/PageHeader";
import { getExperienceEntries, getResumeUrl } from "@/lib/content";
import styles from "./page.module.css";

export const metadata: Metadata = pageMetadata({
  title: "Work",
  description:
    "Work experience, education and a downloadable resume.",
  path: "/work/",
});

export default function WorkPage() {
  // Placeholder and TODO(user) entries never reach the page.
  const entries = getExperienceEntries();
  const resumeUrl = getResumeUrl();

  return (
    <div className={styles.page}>
      <div>
        <PageHeader title="Work" topic="work.*">
          Experience and resume.
        </PageHeader>
        {resumeUrl ? (
          <a href={resumeUrl} download className={styles.resume}>
            Download resume (PDF)
          </a>
        ) : (
          <p className={styles.resumeSoon}>Resume coming soon.</p>
        )}
      </div>

      <ExperienceTimeline entries={entries} />

    </div>
  );
}
