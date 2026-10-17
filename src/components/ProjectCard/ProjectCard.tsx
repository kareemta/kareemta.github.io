import type { Project } from "@/lib/content";
import styles from "./ProjectCard.module.css";

/**
 * Project card: name, one-liner, tech chips and links. Each link keeps its
 * visible label from projects.json ("GitHub", "Demo") and adds the project
 * name for screen readers, e.g. "GitHub for Log Viewer".
 */
export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className={styles.card}>
      <p className={styles.meta}>
        <span className={styles.badge}>Project</span>
        <span className={styles.stream} aria-hidden="true">
          project.added
        </span>
      </p>
      <h3 className={styles.name}>{project.name}</h3>
      <p className={styles.oneLiner}>{project.oneLiner}</p>

      {project.tech.length > 0 && (
        <ul className={styles.tech} aria-label={`Tech used in ${project.name}`}>
          {project.tech.map((t) => (
            <li key={t} className={styles.chip}>
              {t}
            </li>
          ))}
        </ul>
      )}

      {project.links.length > 0 && (
        <ul className={styles.links}>
          {project.links.map((link) => (
            <li key={link.url}>
              <a href={link.url} className={styles.link}>
                {link.label}
                <span className="visually-hidden"> for {project.name}</span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}
