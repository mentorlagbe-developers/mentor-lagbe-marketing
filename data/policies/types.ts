export type PolicyBlock =
  | { kind: "paragraph"; text: string }
  | { kind: "bullets"; items: string[] }
  | { kind: "warning"; text: string }
  | { kind: "numbered"; items: string[] };

export type PolicySection = {
  id: string;
  number?: string;
  title: string;
  subsections?: Array<{
    id: string;
    title: string;
    blocks: PolicyBlock[];
  }>;
  blocks?: PolicyBlock[];
};

export type PolicyDocument = {
  slug: string;
  eyebrow: string;
  title: string;
  lastUpdated: string;
  effectiveDate: string;
  intro: string;
  audience: string;
  sections: PolicySection[];
  acknowledgment: string;
};

export type RolePolicyDocument = PolicyDocument & {
  role: "student" | "teacher";
};
