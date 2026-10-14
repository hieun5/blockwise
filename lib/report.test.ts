import assert from "node:assert/strict";
import test from "node:test";
import {
  createDraft,
  reportText,
  validateDetails,
  validatePhoto,
  type ReportDetails,
} from "./report.ts";

const validDetails: ReportDetails = {
  category: "pothole",
  location: "SE Hawthorne Blvd & SE 12th Ave",
  notes: "",
  portlandConfirmed: true,
};

test("optional observations can be blank, while category, location, and Portland confirmation are required", () => {
  assert.deepEqual(validateDetails(validDetails), {});
  const errors = validateDetails({
    category: "",
    location: "     ",
    notes: "",
    portlandConfirmed: false,
  });
  assert.deepEqual(Object.keys(errors).sort(), [
    "category",
    "location",
    "portlandConfirmed",
  ]);
});

test("location validation trims surrounding whitespace and enforces both length boundaries", () => {
  assert.ok(
    validateDetails({ ...validDetails, location: "  1234  " }).location,
  );
  assert.deepEqual(
    validateDetails({ ...validDetails, location: "  12345  " }),
    {},
  );
  assert.deepEqual(
    validateDetails({ ...validDetails, location: "a".repeat(200) }),
    {},
  );
  assert.ok(
    validateDetails({ ...validDetails, location: "a".repeat(201) }).location,
  );
});

test("observations allow 1,200 characters and reject longer input", () => {
  assert.deepEqual(
    validateDetails({ ...validDetails, notes: "a".repeat(1200) }),
    {},
  );
  assert.ok(
    validateDetails({ ...validDetails, notes: "a".repeat(1201) }).notes,
  );
});

test("unsupported categories cannot pass validation at runtime", () => {
  const untrusted = {
    ...validDetails,
    category: "graffiti",
  } as unknown as ReportDetails;
  assert.ok(validateDetails(untrusted).category);
});

test("photo validation allows all three supported formats and the exact size limit", () => {
  for (const type of ["image/jpeg", "image/png", "image/webp"]) {
    assert.equal(validatePhoto({ type, size: 1 }), null);
    assert.equal(validatePhoto({ type, size: 10 * 1024 * 1024 }), null);
  }
});

test("photo validation rejects oversized, unsupported, empty, and invalid files", () => {
  assert.match(
    validatePhoto({ type: "image/jpeg", size: 10 * 1024 * 1024 + 1 })!,
    /too large/,
  );
  for (const type of [
    "image/heic",
    "image/gif",
    "image/svg+xml",
    "text/plain",
    "",
  ]) {
    assert.match(validatePhoto({ type, size: 100 })!, /JPEG, PNG, or WebP/);
  }
  for (const size of [0, -1, Number.NaN, Number.POSITIVE_INFINITY]) {
    assert.match(
      validatePhoto({ type: "image/jpeg", size })!,
      /empty or unreadable/,
    );
  }
});

test("a draft preserves the resident's observations without inventing severity, dimensions, or photo analysis", () => {
  const notes =
    "  I saw this near the north crosswalk.\nI do not know its depth.  ";
  assert.equal(
    createDraft({
      ...validDetails,
      location: "  SE Hawthorne Blvd & SE 12th Ave  ",
      notes,
    }),
    "I am reporting a pothole at SE Hawthorne Blvd & SE 12th Ave.\n\nI saw this near the north crosswalk.\nI do not know its depth.",
  );
});

test("a streetlight draft without observations does not assert an outage or time of day", () => {
  assert.equal(
    createDraft({ ...validDetails, category: "streetlight", notes: "  " }),
    "I am reporting a streetlight problem at SE Hawthorne Blvd & SE 12th Ave.",
  );
  assert.equal(
    createDraft({ ...validDetails, category: "sidewalk" }),
    "I am reporting a damaged sidewalk at SE Hawthorne Blvd & SE 12th Ave.",
  );
});

test("copying a report uses the edited description and always marks it as not submitted", () => {
  const details = { ...validDetails, notes: "Original observation." };
  const edited = "The damage is next to the bus stop. I could not measure it.";
  const text = reportText(details, `  ${edited}  `);

  assert.match(text, /^Blockwise report draft\n/);
  assert.ok(text.includes("Issue: Pothole"));
  assert.ok(text.includes(`Location: ${validDetails.location}`));
  assert.ok(text.includes(`Description:\n${edited}`));
  assert.ok(!text.includes(details.notes));
  assert.match(text, /not submitted to the City of Portland\.$/);
});
