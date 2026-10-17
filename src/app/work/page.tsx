import type { Metadata } from "next";
import EmptyState from "@/components/EmptyState/EmptyState";
import ExperienceTimeline from "@/components/ExperienceTimeline/ExperienceTimeline";
import PageHeader from "@/components/PageHeader/PageHeader";
import ProjectCard from "@/components/ProjectCard/ProjectCard";
import SectionHeading from "@/components/SectionHeading/SectionHeading";
import {
  getExperienceEntries,
  getProjects,
  getResumeUrl,
  getSite,
  publishable,
} from "@/lib/content";
import styles from "./page.module.css";

export function generateMetadata(): Metadata {
  return { title: `Work · ${getSite().displayName}` };
}

export default function WorkPage() {
  // Placeholder and TODO(user) entries never reach the page.
  const entries = getExperienceEntries();
  const projects = publishable(getProjects());
  const resumeUrl = getResumeUrl();

  return (
    <div className={styles.page}>
      <div>
        <PageHeader title="Work" topic="work.*">
          Experience, resume and projects.
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

      <section aria-labelledby="projects-heading">
        <SectionHeading id="projects-heading" topic="project.*" title="Projects" />
        {projects.length > 0 ? (
          <ul className={styles.projects}>
            {projects.map((project) => (
              <li key={project.name}>
                <ProjectCard project={project} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState stream="0 events · project.* idle">
            Projects will show up here as they are added.
          </EmptyState>
        )}
      </section>
    </div>
  );
}
