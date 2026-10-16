import { ImageResponse } from "next/og";

// Same honest-placeholder reasoning as app/icon.tsx, sized for Apple's
// touch-icon convention.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
          fontSize: 110,
          fontWeight: 600,
        }}
      >
        M
      </div>
    ),
    size,
  );
}
