# Blockwise

A mobile-first neighborhood issue reporter for Portland, Oregon, built for the Nebius x NVIDIA hackathon.

## Milestone 1: a complete manual reporting interface

- Follow a four-step wizard: **Photo → Location → Details → Review**.
- Add one JPEG, PNG, or WebP photo (up to 10 MiB), preview it, replace it, or remove it.
- Enter a street address or intersection and confirm the issue is in Portland. This is a user-provided location, not verified geocoding.
- Choose pothole, damaged sidewalk, or streetlight problem and add optional observations. Streetlight guidance asks about the observed behavior rather than assuming an outage from a photo.
- Review a deterministic draft made only from your inputs and edit the description.
- Confirm your review, then copy or download the text. The original photo must be attached separately when reporting elsewhere.

This milestone runs without API keys, a Nebius account, a database, or paid services. It does **not** perform AI analysis, submit reports, or display official repair status. It is an independent project, not affiliated with the City of Portland.

## Run locally (Mac or Windows)

Use Node.js 24 LTS and npm. From the project folder:

```sh
npm install
npm run dev
```

Open http://localhost:3000 and keep the terminal running. Press Ctrl+C to stop.

## Check the code

```sh
npm test
npm run typecheck
npm run build
```

The tests cover required information, photo validation, and descriptions that preserve resident observations without inventing facts. Native TypeScript test execution requires Node 22.18+ (Node 24 recommended).

### Manual acceptance check

1. Continue without a photo: an actionable required-photo error appears.
2. Add an unsupported, oversized, or damaged photo: see an actionable error.
3. Add a valid photo and continue. Location and Portland confirmation are required before the details step.
4. Choose each category and add optional observations, then continue to review.
5. Edit the description. Copy/download requires an explicit review confirmation; editing invalidates it.
6. Use Back or the completed step buttons to revisit entries. An unchanged detail round-trip preserves the edited description. Changing category/location/notes regenerates it with a notice on the details screen.
7. Copy/download text: verify the edited description and “not submitted” status. Confirm the photo is not included.
8. Start another report: cancel preserves the draft; confirming clears it and returns to Photo.
9. Repeat at a narrow mobile width and use the keyboard to operate the wizard.

## Privacy and limitations

Photos are decoded and previewed locally using temporary browser object URLs. No image or report content is uploaded, and there is no browser storage or analytics. The draft exists in memory in the current tab; reloading clears it. Text exports contain the location and observations you entered. Keep downloaded files only where you intend to save them.

The app does not validate municipal jurisdiction, classify photos, detect emergencies, or route reports yet. It is a reporting draft tool for non-emergency neighborhood issues.

## How the code fits together

- `app/page.tsx`: homepage entry point.
- `components/report-builder.tsx`: form, local photo handling, review, and text export.
- `components/icon.tsx` and `components/neighborhood.tsx`: original vector artwork.
- `app/globals.css`: responsive visual design.
- `lib/report.ts`: shared data types, validation, and deterministic draft formatting.
- `lib/report.test.ts`: focused tests of those rules.

## Next milestones

1. Add an NVIDIA model through Nebius Token Factory or Nebius AI Cloud after access is available. Model availability, image input support, and licensing must be verified before selection. Keep credentials on the server.
2. Add verified city reporting links keyed to the resident-reviewed category.
3. Add failure handling and inference limits, then deploy and prepare the hackathon submission.

A real NVIDIA/Nebius runtime integration is still required before this project meets the hackathon's model/platform requirement. Milestone 1 is the interface foundation.
