export type DocAnchor = { id: string; label: string };
export type DocPage = { slug: string; label: string; anchors?: DocAnchor[] };
export type DocGroup = { title: string; pages: DocPage[] };

export const DOC_GROUPS: DocGroup[] = [
  {
    title: "Getting Started",
    pages: [
      { slug: "overview", label: "Overview" },
      { slug: "quickstart", label: "3-Minute Quickstart" },
      { slug: "core-concepts", label: "Core Concepts" },
    ],
  },
  {
    title: "AI Agent Integration",
    pages: [
      { slug: "agent-architecture", label: "How Agents Spend" },
      { slug: "tool-schema", label: "Tool Schema & Code" },
    ],
  },
  {
    title: "Spending Rules",
    pages: [
      {
        slug: "spending-rules",
        label: "Rule Structure & Caps",
        anchors: [{ id: "delayed-loosening", label: "Instant tightening vs delay" }],
      },
    ],
  },
  {
    title: "Safety & Community Watch",
    pages: [
      {
        slug: "review-delay",
        label: "Review Delay & Safety",
        anchors: [
          { id: "reviewer-rewards", label: "Reviewer rewards" },
          { id: "emergency-freeze", label: "Emergency freeze & veto" },
        ],
      },
    ],
  },
  {
    title: "Contract Reference",
    pages: [
      {
        slug: "contract-overview",
        label: "Contract & Methods",
        anchors: [
          { id: "owner-methods", label: "Owner methods" },
          { id: "agent-methods", label: "Agent methods" },
          { id: "reviewer-methods", label: "Reviewer & public methods" },
          { id: "view-queries", label: "Read-only views" },
        ],
      },
    ],
  },
  {
    title: "Reference & FAQ",
    pages: [
      {
        slug: "status",
        label: "Status & Limits",
        anchors: [
          { id: "threat-model", label: "What you still trust" },
          { id: "audit", label: "Audit progress" },
        ],
      },
      { slug: "error-codes", label: "Error Messages & Fixes" },
      { slug: "faq", label: "FAQ" },
    ],
  },
];

export const DOC_PAGES: (DocPage & { group: string })[] = DOC_GROUPS.flatMap((g) =>
  g.pages.map((p) => ({ ...p, group: g.title })),
);

export function pageBySlug(slug: string) {
  return DOC_PAGES.find((p) => p.slug === slug);
}

/** Which page owns an in-page anchor id (used to keep old /docs#id links working). */
export function pageForAnchor(id: string) {
  return DOC_PAGES.find((p) => p.slug === id || p.anchors?.some((a) => a.id === id));
}
