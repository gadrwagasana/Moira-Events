import { ImageResponse } from "next/og";

// No dedicated square icon/monogram asset exists yet — the real logo
// (components/Logo.tsx) is a wide wordmark (1496x706), which Next would
// serve as-is without cropping if used directly, distorting badly at
// favicon size. This generates a simple, honest placeholder using only the
// brand's own already-established colors (app/globals.css) and initial,
// not a fabricated new brand mark. Replace with a real exported icon asset
// once the owner supplies one (SETUP.md already notes photography/branding
// as pending owner decisions).
export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#5c4033",
          color: "#fbf9f6",
          fontSize: 22,
          fontWeight: 600,
        }}
      >
        M
      </div>
    ),
    size,
  );
}
