"use client";

import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type FormEvent,
} from "react";
import {
  createDraft,
  ISSUE_TYPES,
  reportText,
  validateDetails,
  validatePhoto,
  type ReportDetails,
} from "@/lib/report";
import Icon from "./icon";
import Neighborhood from "./neighborhood";

const EMPTY_DETAILS: ReportDetails = {
  category: "",
  location: "",
  notes: "",
  portlandConfirmed: false,
};
type FormErrors = ReturnType<typeof validateDetails> & { photo?: string };
type Photo = { file: File; url: string };
const STEPS = ["photo", "location", "details", "review"] as const;
type Step = (typeof STEPS)[number];
const STEP_TITLES: Record<Step, string> = {
  photo: "Show us what you see.",
  location: "Where did you spot it?",
  details: "Tell the whole story.",
  review: "Make every detail count.",
};
const STEP_LEADS: Record<Step, string> = {
  photo: "Start with one clear photo of the issue.",
  location: "An address or intersection helps someone find the right spot.",
  details: "Choose a category and share what you observed.",
  review: "Check your report, make it your own, and save the text.",
};

export default function ReportBuilder() {
  const [step, setStep] = useState<Step>("photo");
  const [details, setDetails] = useState<ReportDetails>(EMPTY_DETAILS);
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [errors, setErrors] = useState<FormErrors>({});
  const [photoBusy, setPhotoBusy] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [description, setDescription] = useState("");
  const [reviewed, setReviewed] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [status, setStatus] = useState("");
  const [lastDetails, setLastDetails] = useState("");
  const [showReset, setShowReset] = useState(false);
  const photoInput = useRef<HTMLInputElement>(null);
  const formTop = useRef<HTMLHeadingElement>(null);
  const errorSummary = useRef<HTMLDivElement>(null);
  const activePhotoUrl = useRef<string | null>(null);
  const photoRequest = useRef(0);
  const mounted = useRef(true);
  const selectedIssue = ISSUE_TYPES.find(
    (issue) => issue.id === details.category,
  );
  const stepIndex = STEPS.indexOf(step);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      photoRequest.current += 1;
      if (activePhotoUrl.current) URL.revokeObjectURL(activePhotoUrl.current);
    };
  }, []);

  function updateDetails<K extends keyof ReportDetails>(
    key: K,
    value: ReportDetails[K],
  ) {
    setDetails((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setReviewed(false);
    setStatus("");
  }

  async function choosePhoto(file?: File) {
    if (!file) return;
    const request = ++photoRequest.current;
    const error = validatePhoto(file);
    setErrors((current) => ({ ...current, photo: error ?? undefined }));
    setPhotoBusy(false);
    if (error) return;
    setPhotoBusy(true);
    const url = URL.createObjectURL(file);
    try {
      // Decode locally so a renamed or damaged file cannot become a valid photo.
      await new Promise<void>((resolve, reject) => {
        const image = new window.Image();
        image.onload = () => resolve();
        image.onerror = () => reject(new Error("Image could not be decoded"));
        image.src = url;
      });
      if (!mounted.current || request !== photoRequest.current) {
        URL.revokeObjectURL(url);
        return;
      }
      if (activePhotoUrl.current) URL.revokeObjectURL(activePhotoUrl.current);
      activePhotoUrl.current = url;
      setPhoto({ file, url });
      setReviewed(false);
      setStatus("Photo added. It stays in this browser tab.");
    } catch {
      URL.revokeObjectURL(url);
      if (mounted.current && request === photoRequest.current) {
        setErrors((current) => ({
          ...current,
          photo:
            "This photo could not be opened. Try another JPEG, PNG, or WebP image.",
        }));
      }
    } finally {
      if (mounted.current && request === photoRequest.current)
        setPhotoBusy(false);
    }
  }

  function removePhoto() {
    photoRequest.current += 1;
    if (activePhotoUrl.current) URL.revokeObjectURL(activePhotoUrl.current);
    activePhotoUrl.current = null;
    setPhoto(null);
    setPhotoBusy(false);
    setErrors((current) => ({ ...current, photo: undefined }));
    setReviewed(false);
    setStatus("Photo removed.");
  }

  function focusForm() {
    requestAnimationFrame(() => {
      formTop.current?.focus({ preventScroll: true });
      formTop.current?.scrollIntoView({ behavior: "auto", block: "start" });
    });
  }

  function navigateTo(nextStep: Step) {
    setStep(nextStep);
    setErrors({});
    setStatus("");
    setShowReset(false);
    focusForm();
  }

  function advanceWizard(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (photoBusy) return;
    const validation = validateDetails(details);
    const nextErrors: FormErrors = {};
    if (step === "photo") {
      if (!photo) nextErrors.photo = "Add a photo of the issue to continue.";
      else if (errors.photo) nextErrors.photo = errors.photo;
    } else if (step === "location") {
      if (validation.location) nextErrors.location = validation.location;
      if (validation.portlandConfirmed)
        nextErrors.portlandConfirmed = validation.portlandConfirmed;
    } else if (step === "details") {
      if (validation.category) nextErrors.category = validation.category;
      if (validation.notes) nextErrors.notes = validation.notes;
    }
    setErrors(nextErrors);
    if (Object.values(nextErrors).some(Boolean)) {
      requestAnimationFrame(() => errorSummary.current?.focus());
      return;
    }
    if (step === "details") {
      const snapshot = JSON.stringify(details);
      if (lastDetails !== snapshot) setDescription(createDraft(details));
      setLastDetails(snapshot);
      setReviewError("");
      setReviewed(false);
    }
    navigateTo(STEPS[stepIndex + 1]);
  }

  function canExport() {
    if (!description.trim()) {
      setReviewError(
        "Add a description before copying or downloading your draft.",
      );
      document.getElementById("description")?.focus();
      return false;
    }
    if (!reviewed) {
      setReviewError(
        "Confirm you have reviewed the details before saving your draft.",
      );
      document.getElementById("reviewed")?.focus();
      return false;
    }
    setReviewError("");
    return true;
  }

  async function copyDraft() {
    if (!canExport()) return;
    try {
      await navigator.clipboard.writeText(reportText(details, description));
      setStatus(
        "Report text copied. Your photo is separate. Nothing has been submitted.",
      );
    } catch {
      setStatus(
        "Clipboard access is unavailable. Use Download text to save your draft instead.",
      );
    }
  }

  function downloadDraft() {
    if (!canExport()) return;
    const url = URL.createObjectURL(
      new Blob([reportText(details, description)], {
        type: "text/plain;charset=utf-8",
      }),
    );
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `blockwise-${details.category}-draft.txt`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus(
      "Text download started. Keep your original photo to attach separately.",
    );
  }

  function resetReport() {
    removePhoto();
    setDetails(EMPTY_DETAILS);
    setErrors({});
    setDescription("");
    setLastDetails("");
    setReviewed(false);
    setReviewError("");
    setShowReset(false);
    setStatus("Started a new report.");
    setStep("photo");
    focusForm();
  }

  const errorCount = Object.values(errors).filter(Boolean).length;
  return (
    <>
      <a className="skip-link" href="#report">
        Skip to report
      </a>
      <header className="site-header">
        <a className="wordmark" href="#top" aria-label="Blockwise home">
          <span className="brand-symbol">
            <span />
            <span />
            <span />
            <span />
          </span>
          blockwise<span className="brand-dot">.</span>
        </a>
        <div className="header-location">
          <Icon name="pin" size={16} /> Portland, Oregon
        </div>
        <a className="header-link" href="#how-it-works">
          How it works <span aria-hidden="true">↗</span>
        </a>
      </header>

      <main id="top" className="page-shell">
        <section className="hero" aria-labelledby="hero-title">
          <div>
            <p className="eyebrow">
              <span className="green-dot" /> FOR THE BLOCK YOU CALL HOME
            </p>
            <h1 id="hero-title">
              Your block.
              <br />
              <em>Your voice.</em>
            </h1>
            <p className="hero-description">
              See a problem. Take the first step.
              <br className="desktop-break" /> Build a clear report for a better
              Portland.
            </p>
          </div>
          <div className="hero-note">
            <Icon name="leaf" size={28} />
            <p>
              Small actions.
              <br />
              <strong>Better blocks.</strong>
            </p>
            <span>MADE FOR PORTLAND</span>
          </div>
        </section>

        <div className="workspace-grid">
          <section
            id="report"
            className="report-panel"
            aria-label="Prepare a neighborhood report"
          >
            <div className="panel-heading">
              <div>
                <span className="eyebrow">LET’S MAKE IT BETTER</span>
                <h2>Start a neighborhood report</h2>
              </div>
              <span className="draft-badge">
                <span /> Local draft
              </span>
            </div>
            <ol className="stepper" aria-label="Report progress">
              {STEPS.map((item, index) => (
                <li
                  key={item}
                  className={
                    stepIndex === index
                      ? "active"
                      : stepIndex > index
                        ? "complete"
                        : ""
                  }
                  aria-current={stepIndex === index ? "step" : undefined}
                >
                  <button
                    type="button"
                    className="wizard-step-button"
                    onClick={() => navigateTo(item)}
                    disabled={index >= stepIndex}
                    aria-label={`${index + 1}. ${item[0].toUpperCase() + item.slice(1)}${index === stepIndex ? ", current step" : ""}`}
                  >
                    <span className="wizard-step-number">
                      {index < stepIndex ? (
                        <Icon name="check" size={14} />
                      ) : (
                        index + 1
                      )}
                    </span>
                    <span>{item[0].toUpperCase() + item.slice(1)}</span>
                  </button>
                </li>
              ))}
            </ol>

            {step !== "review" ? (
              <form noValidate onSubmit={advanceWizard} className="report-form">
                {errorCount > 0 && (
                  <div
                    className="error-summary"
                    role="alert"
                    tabIndex={-1}
                    ref={errorSummary}
                  >
                    <strong>A few details need your attention.</strong>
                    <ul>
                      {Object.entries(errors)
                        .filter(([, message]) => message)
                        .map(([key, message]) => (
                          <li key={key}>
                            <a
                              href={`#${key === "photo" ? "photo-input" : key}`}
                            >
                              {message}
                            </a>
                          </li>
                        ))}
                    </ul>
                  </div>
                )}

                <div className="wizard-step-meta">
                  STEP {stepIndex + 1} OF 4
                </div>
                <h3 className="wizard-heading" tabIndex={-1} ref={formTop}>
                  {STEP_TITLES[step]}
                </h3>
                <p className="wizard-lead">{STEP_LEADS[step]}</p>

                {step === "photo" && (
                  <div className="photo-step">
                    <div className="field-section">
                      <div className="section-label">
                        <label htmlFor="photo-input">Issue photo</label>
                        <span className="required-text">Required</span>
                      </div>
                      <input
                        className="sr-only"
                        id="photo-input"
                        ref={photoInput}
                        type="file"
                        accept="image/jpeg,image/png,image/webp"
                        aria-describedby={`photo-hint${errors.photo ? " photo-error" : ""}`}
                        aria-invalid={!!errors.photo}
                        onChange={(event: ChangeEvent<HTMLInputElement>) => {
                          void choosePhoto(event.target.files?.[0]);
                          event.target.value = "";
                        }}
                      />
                      <div
                        className={`photo-area ${dragging ? "dragging" : ""} ${errors.photo ? "invalid" : ""}`}
                        onDragOver={(event) => {
                          event.preventDefault();
                          setDragging(true);
                        }}
                        onDragLeave={() => setDragging(false)}
                        onDrop={(event) => {
                          event.preventDefault();
                          setDragging(false);
                          if (event.dataTransfer.files.length !== 1) {
                            setErrors((current) => ({
                              ...current,
                              photo: "Choose one photo for this report.",
                            }));
                            return;
                          }
                          void choosePhoto(event.dataTransfer.files[0]);
                        }}
                      >
                        {photo ? (
                          <div className="photo-selected">
                            {/* A local blob preview stays in the browser without an optimizer upload. */}
                            <img
                              src={photo.url}
                              alt="Your selected issue photo"
                            />
                            <div className="photo-file-info">
                              <strong>{photo.file.name}</strong>
                              <span>
                                {(photo.file.size / (1024 * 1024)).toFixed(1)}{" "}
                                MB · Ready to review
                              </span>
                              <div>
                                <button
                                  type="button"
                                  className="text-button"
                                  onClick={() => photoInput.current?.click()}
                                >
                                  Replace photo
                                </button>
                                <button
                                  type="button"
                                  className="text-button muted-button"
                                  onClick={removePhoto}
                                >
                                  Remove
                                </button>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <button
                            className="upload-button"
                            type="button"
                            onClick={() => photoInput.current?.click()}
                            disabled={photoBusy}
                          >
                            <span className="upload-icon">
                              <Icon name="camera" size={27} />
                            </span>
                            <strong>
                              {photoBusy
                                ? "Opening your photo…"
                                : "A picture helps tell the story"}
                            </strong>
                            <span>
                              <span className="upload-action">
                                Choose a photo
                              </span>{" "}
                              <span className="drag-hint">or drag it here</span>
                            </span>
                            <small>JPG, PNG or WebP · Up to 10 MB</small>
                          </button>
                        )}
                      </div>
                      {photoBusy && photo && (
                        <p className="field-hint" role="status">
                          Opening your new photo…
                        </p>
                      )}
                      <p id="photo-hint" className="field-hint">
                        <Icon name="lock" size={13} /> Your photo stays in this
                        tab. It is not uploaded or analyzed.
                      </p>
                      {errors.photo && (
                        <p id="photo-error" className="field-error">
                          {errors.photo}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {step === "location" && (
                  <div className="location-step">
                    <div className="field-section">
                      <div className="section-label">
                        <label htmlFor="location">
                          Street address or intersection
                        </label>
                        <span className="required-text">Required</span>
                      </div>
                      <div className="input-with-icon">
                        <Icon name="pin" size={20} />
                        <input
                          id="location"
                          name="location"
                          type="text"
                          placeholder="Street address or nearest intersection"
                          value={details.location}
                          onChange={(event) =>
                            updateDetails("location", event.target.value)
                          }
                          maxLength={200}
                          autoComplete="off"
                          required
                          aria-invalid={!!errors.location}
                          aria-describedby={`location-hint${errors.location ? " location-error" : ""}`}
                        />
                      </div>
                      <p id="location-hint" className="field-hint">
                        For example: SE Hawthorne Blvd & SE 12th Ave.
                      </p>
                      {errors.location && (
                        <p id="location-error" className="field-error">
                          {errors.location}
                        </p>
                      )}
                      <label className="checkbox-row">
                        <input
                          id="portlandConfirmed"
                          type="checkbox"
                          checked={details.portlandConfirmed}
                          onChange={(event) =>
                            updateDetails(
                              "portlandConfirmed",
                              event.target.checked,
                            )
                          }
                          required
                          aria-invalid={!!errors.portlandConfirmed}
                          aria-describedby={
                            errors.portlandConfirmed
                              ? "portland-error"
                              : "portland-hint"
                          }
                        />
                        <span>
                          I confirm this issue is in Portland, Oregon.
                        </span>
                      </label>
                      <p
                        id="portland-hint"
                        className="field-hint confirmation-hint"
                      >
                        Location is provided by you and has not been verified.
                      </p>
                      {errors.portlandConfirmed && (
                        <p id="portland-error" className="field-error">
                          {errors.portlandConfirmed}
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {step === "details" && (
                  <div className="details-step">
                    <fieldset
                      className="field-section category-field"
                      id="category"
                      tabIndex={-1}
                      aria-describedby={
                        errors.category ? "category-error" : undefined
                      }
                    >
                      <legend>
                        What did you notice?{" "}
                        <span className="required-text">Required</span>
                      </legend>
                      <div className="category-options">
                        {ISSUE_TYPES.map((issue) => (
                          <label
                            className={`category-option ${details.category === issue.id ? "selected" : ""}`}
                            key={issue.id}
                          >
                            <input
                              type="radio"
                              name="category"
                              aria-label={issue.label}
                              aria-describedby={`${issue.id}-hint`}
                              value={issue.id}
                              checked={details.category === issue.id}
                              onChange={() =>
                                updateDetails("category", issue.id)
                              }
                              required
                              aria-invalid={!!errors.category}
                            />
                            <span className="category-icon">
                              <Icon name={issue.id} size={27} />
                            </span>
                            <span className="category-title">
                              {issue.label}
                            </span>
                            <span
                              id={`${issue.id}-hint`}
                              className="category-description"
                            >
                              {issue.description}
                            </span>
                            <span className="radio-mark">
                              {details.category === issue.id && (
                                <Icon name="check" size={11} />
                              )}
                            </span>
                          </label>
                        ))}
                      </div>
                      {errors.category && (
                        <p id="category-error" className="field-error">
                          {errors.category}
                        </p>
                      )}
                    </fieldset>

                    <div className="field-section notes-section">
                      <div className="section-label">
                        <label htmlFor="notes">What did you observe?</label>
                        <span className="required-text">Optional</span>
                      </div>
                      <textarea
                        id="notes"
                        name="notes"
                        placeholder={
                          details.category === "streetlight"
                            ? "When did you notice the problem? Is the light off at night, flickering, or damaged? Add a pole number if you can see one."
                            : "Describe what you noticed. Nearby landmarks and which side of the street can help."
                        }
                        rows={4}
                        maxLength={1200}
                        value={details.notes}
                        onChange={(event) =>
                          updateDetails("notes", event.target.value)
                        }
                        aria-invalid={!!errors.notes}
                        aria-describedby={
                          errors.notes ? "notes-hint notes-error" : "notes-hint"
                        }
                      />
                      <div className="notes-footer">
                        <span id="notes-hint">Stick to what you observed.</span>
                        <span>{details.notes.length}/1,200</span>
                      </div>
                      {errors.notes && (
                        <p id="notes-error" className="field-error">
                          {errors.notes}
                        </p>
                      )}
                    </div>
                    {lastDetails && (
                      <p className="edit-notice">
                        Changing the details rebuilds your draft description.
                        Review it again before saving.
                      </p>
                    )}
                  </div>
                )}
                <div className="form-bottom wizard-navigation">
                  {stepIndex > 0 ? (
                    <button
                      className="text-button wizard-back"
                      type="button"
                      onClick={() => navigateTo(STEPS[stepIndex - 1])}
                    >
                      <Icon name="back" size={17} /> Back
                    </button>
                  ) : (
                    <span>
                      <Icon name="lock" size={15} /> Your photo stays on your
                      device.
                    </span>
                  )}
                  <button
                    className="button-primary"
                    type="submit"
                    disabled={photoBusy}
                  >
                    {step === "details" ? "Review my draft" : "Continue"}{" "}
                    <Icon name="arrow" size={18} />
                  </button>
                </div>
              </form>
            ) : (
              <div className="review-content">
                <div className="wizard-step-meta">STEP 4 OF 4</div>
                <h3 className="wizard-heading" tabIndex={-1} ref={formTop}>
                  {STEP_TITLES.review}
                </h3>
                <p className="wizard-lead">{STEP_LEADS.review}</p>
                <div className="review-intro">
                  <span className="review-intro-icon">
                    <Icon name="file" size={22} />
                  </span>
                  <p>
                    <strong>Your observations, organized.</strong>
                    <br />
                    This draft uses the details you entered. Check the
                    description and make any changes below.
                  </p>
                </div>
                <div className="review-summary">
                  {photo && (
                    <img
                      src={photo.url}
                      alt="Issue photo included in your review"
                    />
                  )}
                  <dl>
                    <div>
                      <dt>ISSUE</dt>
                      <dd>{selectedIssue?.label}</dd>
                    </div>
                    <div>
                      <dt>LOCATION · USER PROVIDED</dt>
                      <dd>
                        {details.location.trim()}
                        <span>Portland, Oregon</span>
                      </dd>
                    </div>
                  </dl>
                </div>
                <button
                  className="text-button edit-details"
                  type="button"
                  onClick={() => navigateTo("details")}
                >
                  <Icon name="back" size={15} /> Edit details
                </button>
                <label className="description-label" htmlFor="description">
                  Report description <span>Editable</span>
                </label>
                <textarea
                  id="description"
                  className="draft-description"
                  rows={7}
                  maxLength={3000}
                  value={description}
                  onChange={(event) => {
                    setDescription(event.target.value);
                    setReviewed(false);
                    setReviewError("");
                    setStatus("");
                  }}
                  aria-describedby="description-hint"
                />
                <p id="description-hint" className="field-hint">
                  Manual draft · No AI analysis has been performed.
                </p>
                <label className="checkbox-row review-check">
                  <input
                    id="reviewed"
                    type="checkbox"
                    checked={reviewed}
                    onChange={(event) => {
                      setReviewed(event.target.checked);
                      setReviewError("");
                      setStatus("");
                    }}
                  />
                  <span>
                    I’ve checked the category, location and description, and
                    they reflect what I observed.
                  </span>
                </label>
                {reviewError && (
                  <p role="alert" className="field-error">
                    {reviewError}
                  </p>
                )}
                <div className="review-actions">
                  <button
                    className="button-primary"
                    type="button"
                    onClick={() => void copyDraft()}
                  >
                    <Icon name="copy" size={18} /> Copy report text
                  </button>
                  <button
                    className="button-secondary"
                    type="button"
                    onClick={downloadDraft}
                  >
                    <Icon name="download" size={18} /> Download text
                  </button>
                </div>
                <p className="export-note">
                  Text exports don’t include the photo. Keep your original image
                  to attach separately. This draft has not been sent to the City
                  of Portland.
                </p>
                <div className="next-feature">
                  <span className="soon-label">UP NEXT</span>
                  <p>
                    <strong>The right place to report it.</strong>
                    <br />
                    Official city reporting links and AI assistance are coming
                    soon.
                  </p>
                </div>
                {showReset ? (
                  <div
                    className="reset-confirm"
                    role="group"
                    aria-label="Confirm clearing your draft"
                  >
                    <p>
                      Clear this draft and photo? Download the text first if you
                      want to keep it.
                    </p>
                    <div>
                      <button
                        className="button-secondary"
                        type="button"
                        onClick={() => setShowReset(false)}
                      >
                        Keep editing
                      </button>
                      <button
                        className="text-button danger-button"
                        type="button"
                        onClick={resetReport}
                      >
                        Clear and start again
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    className="text-button new-report"
                    type="button"
                    onClick={() => setShowReset(true)}
                  >
                    Start another report
                  </button>
                )}
              </div>
            )}
            <div
              className={`status-message ${status ? "has-status" : ""}`}
              role="status"
              aria-live="polite"
            >
              {status}
            </div>
          </section>

          <aside className="sidebar">
            <section className="neighborhood-card">
              <div className="neighborhood-copy">
                <span className="eyebrow">POWERED BY PEOPLE WHO NOTICE</span>
                <h2>
                  Small actions.
                  <br />
                  Better blocks.
                </h2>
                <p>
                  A rough sidewalk. A light gone dark.
                  <br />A small report can be a first step.
                </p>
              </div>
              <Neighborhood />
              <div className="neighborhood-caption">
                <Icon name="pin" size={14} />
                <span>Portland, Oregon</span>
                <span className="coordinate">45.52° N · 122.68° W</span>
              </div>
            </section>
            <section id="how-it-works" className="how-it-works">
              <span className="eyebrow">A LITTLE CARE GOES A LONG WAY</span>
              <h2>See it. Say something.</h2>
              <ol>
                <li>
                  <span>1</span>
                  <div>
                    <h3>Show what you see</h3>
                    <p>Start with a photo of the issue.</p>
                  </div>
                </li>
                <li>
                  <span>2</span>
                  <div>
                    <h3>Put it on the block</h3>
                    <p>Add a location, category and observations.</p>
                  </div>
                </li>
                <li>
                  <span>3</span>
                  <div>
                    <h3>Make it clear</h3>
                    <p>Review and save a draft in your words.</p>
                  </div>
                </li>
              </ol>
            </section>
            <div className="privacy-note">
              <Icon name="lock" size={18} />
              <p>
                <strong>You’re in control.</strong>
                <br />
                Nothing is sent automatically. Drafts stay in this tab and are
                cleared when you reload or leave.
              </p>
            </div>
          </aside>
        </div>
        <footer className="site-footer">
          <span>
            blockwise<span className="brand-dot">.</span>{" "}
            <span className="footer-tagline">
              A little care for where we live.
            </span>
          </span>
          <p>
            Independent community project · Not affiliated with the City of
            Portland.
          </p>
        </footer>
      </main>
    </>
  );
}
