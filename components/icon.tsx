export type IconName =
  | "arrow"
  | "back"
  | "pin"
  | "camera"
  | "check"
  | "pothole"
  | "sidewalk"
  | "streetlight"
  | "lock"
  | "file"
  | "copy"
  | "download"
  | "leaf";

export default function Icon({
  name,
  size = 20,
}: {
  name: IconName;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.65"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {name === "arrow" && <path d="M4 12h15m-6-6 6 6-6 6" />}
      {name === "back" && <path d="M20 12H5m6-6-6 6 6 6" />}
      {name === "pin" && (
        <>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
      {name === "camera" && (
        <>
          <path d="M8 6 9.5 3h5L16 6h4a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1Z" />
          <circle cx="12" cy="12.5" r="4" />
        </>
      )}
      {name === "check" && <path d="m5 12 4 4L19 6" />}
      {name === "pothole" && (
        <>
          <path d="m7 3-4 18M17 3l4 18M12 3v4m0 11v3" />
          <path d="m7 13 3-3 5 1 2 3-4 2-5-1Z" />
        </>
      )}
      {name === "sidewalk" && (
        <>
          <path d="M4 3h16v18H4Zm0 6h16M4 15h16M12 3v6m0 6v6" />
          <path d="m13 9-3 3 3 1-2 2" />
        </>
      )}
      {name === "streetlight" && (
        <>
          <path d="M9 21V6a3 3 0 0 1 3-3h4m-10 18h7M13 8h8l-2-5h-4Zm1 4-1 2m5-2 1 2m-3-2v3" />
        </>
      )}
      {name === "lock" && (
        <>
          <rect x="5" y="10" width="14" height="11" rx="2" />
          <path d="M8 10V6a4 4 0 0 1 8 0v4m-4 5v2" />
        </>
      )}
      {name === "file" && <path d="M14 3H5v18h14V8Zm0 0v5h5M8 12h8m-8 4h6" />}
      {name === "copy" && (
        <>
          <rect x="8" y="8" width="12" height="13" rx="2" />
          <path d="M15 8V3H3v13h5" />
        </>
      )}
      {name === "download" && <path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" />}
      {name === "leaf" && (
        <>
          <path d="M20 3C7 2 2 8 5 15s16 4 15-12Z" />
          <path d="m3 21 12-12M8 16v-5m0 5h5" />
        </>
      )}
    </svg>
  );
}
