export type IssueCategory = "pothole" | "sidewalk" | "streetlight";

export const ISSUE_TYPES: {
  id: IssueCategory;
  label: string;
  description: string;
}[] = [
  {
    id: "pothole",
    label: "Pothole",
    description: "A hole or damaged surface in the road.",
  },
  {
    id: "sidewalk",
    label: "Damaged sidewalk",
    description: "Cracks, uneven pavement, or a damaged walking surface.",
  },
  {
    id: "streetlight",
    label: "Broken streetlight",
    description: "A light that is out, flickering, or visibly damaged.",
  },
];

export type ReportDetails = {
  category: IssueCategory | "";
  location: string;
  notes: string;
  portlandConfirmed: boolean;
};

type DetailErrors = Partial<Record<keyof ReportDetails, string>>;

export function validateDetails(details: ReportDetails): DetailErrors {
  const errors: DetailErrors = {};
  const location = details.location.trim();

  if (!ISSUE_TYPES.some((issue) => issue.id === details.category)) {
    errors.category = "Choose the issue that best matches what you observed.";
  }
  if (location.length < 5) {
    errors.location =
      "Enter a street address or intersection (at least 5 characters).";
  } else if (location.length > 200) {
    errors.location = "Keep the location to 200 characters or fewer.";
  }
  if (details.notes.length > 1200) {
    errors.notes = "Keep your observations to 1,200 characters or fewer.";
  }
  if (!details.portlandConfirmed) {
    errors.portlandConfirmed =
      "Confirm that this location is in Portland, Oregon.";
  }

  return errors;
}

export function validatePhoto(file: {
  type: string;
  size: number;
}): string | null {
  if (!Number.isFinite(file.size) || file.size <= 0) {
    return "This photo is empty or unreadable. Choose another photo.";
  }
  if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
    return "Choose a JPEG, PNG, or WebP photo.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "This photo is too large. Choose one that is 10 MB or smaller.";
  }
  return null;
}

// This template uses only the resident's choices and text. It does not analyze photos.
export function createDraft(details: ReportDetails): string {
  const issuePhrases: Record<IssueCategory, string> = {
    pothole: "a pothole",
    sidewalk: "a damaged sidewalk",
    streetlight: "a streetlight problem",
  };
  const issue = details.category
    ? issuePhrases[details.category]
    : "a neighborhood issue";
  const introduction = `I am reporting ${issue} at ${details.location.trim()}.`;
  const notes = details.notes.trim();

  return notes ? `${introduction}\n\n${notes}` : introduction;
}

export function reportText(
  details: ReportDetails,
  description: string,
): string {
  const category =
    ISSUE_TYPES.find((issue) => issue.id === details.category)?.label ??
    "Not selected";

  return [
    "Blockwise report draft",
    "",
    `Issue: ${category}`,
    `Location: ${details.location.trim()}`,
    "",
    "Description:",
    description.trim(),
    "",
    "Status: Draft only — not submitted to the City of Portland.",
  ].join("\n");
}
