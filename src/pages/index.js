import clsx from 'clsx';
import Link from '@docusaurus/Link';
import useDocusaurusContext from '@docusaurus/useDocusaurusContext';
import Layout from '@theme/Layout';
import styles from './index.module.css';

/**
 * Hero section — the first thing visitors see on the docs homepage.
 */
function HomepageHeader() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <header className={clsx('hero', styles.heroBanner)}>
      <div className="container">
        <h1 className={clsx('hero__title', styles.heroTitle)}>
          Workhall Documentation
        </h1>
        <p className={clsx('hero__subtitle', styles.heroSubtitle)}>
          Everything you need to build, automate, and scale with the Workhall platform.
          <br />
          <span className={styles.heroHighlight}>Now with AI-powered search — press Ctrl+K to try it.</span>
        </p>
        <div className={styles.buttons}>
          <Link
            className="button button--primary button--lg"
            to="/docs/intro">
            Get Started →
          </Link>
          <Link
            className="button button--outline button--lg"
            to="/docs/api/overview">
            API Reference
          </Link>
        </div>
      </div>
    </header>
  );
}

/**
 * Feature cards section highlighting key documentation areas.
 */
const features = [
  {
    title: 'Authentication & Security',
    icon: '🔐',
    description: 'OAuth 2.0, SAML SSO, 2FA, and role-based access control. Secure your workspace with enterprise-grade authentication.',
    link: '/docs/features/authentication',
  },
  {
    title: 'Workflow Automation',
    icon: '⚡',
    description: 'Build powerful automated workflows with triggers, actions, and conditions — no coding required.',
    link: '/docs/features/workflows',
  },
  {
    title: 'Integrations',
    icon: '🔌',
    description: 'Connect with Slack, Jira, GitHub, Google Workspace, and dozens more. Build custom integrations with webhooks.',
    link: '/docs/features/integrations',
  },
  {
    title: 'REST API',
    icon: '📡',
    description: 'Full REST API with SDKs for JavaScript, Python, and Go. Programmatically manage every aspect of your workspace.',
    link: '/docs/api/overview',
  },
  {
    title: 'Getting Started',
    icon: '🚀',
    description: 'Set up your workspace, configure your environment, and create your first workflow in minutes.',
    link: '/docs/getting-started',
  },
  {
    title: 'AI Search',
    icon: '✨',
    description: 'Ask questions in natural language and get instant AI-generated answers from across the documentation.',
    link: '/docs/intro',
  },
];

function FeatureCard({ title, icon, description, link }) {
  return (
    <Link to={link} className={styles.featureCard}>
      <div className={styles.featureIcon}>{icon}</div>
      <h3 className={styles.featureTitle}>{title}</h3>
      <p className={styles.featureDescription}>{description}</p>
    </Link>
  );
}

export default function Home() {
  const { siteConfig } = useDocusaurusContext();
  return (
    <Layout
      title="Home"
      description="Workhall Documentation Hub — AI-powered documentation for the Workhall workflow automation platform.">
      <HomepageHeader />
      <main className={styles.mainContent}>
        <div className="container">
          <div className={styles.featuresGrid}>
            {features.map((feature, idx) => (
              <FeatureCard key={idx} {...feature} />
            ))}
          </div>
        </div>
      </main>
    </Layout>
  );
}
