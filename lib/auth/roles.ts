export const practiceRoles = [
  "owner",
  "professional",
  "office_staff",
  "accounts",
  "reviewer",
] as const;

export type PracticeRole = (typeof practiceRoles)[number];

export const roleLabels: Record<PracticeRole, string> = {
  owner: "Practice owner",
  professional: "Professional",
  office_staff: "Office staff",
  accounts: "Accounts & billing",
  reviewer: "Read-only reviewer",
};
