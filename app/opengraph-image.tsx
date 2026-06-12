import { readFile } from "fs/promises";
import { ImageResponse } from "next/og";
import path from "path";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logoData = await readFile(
    path.join(process.cwd(), "public/logosLembrai/lembrai-wordmark-light.png")
  );
  const logoSrc = `data:image/png;base64,${logoData.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          background: "#14151A",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {/* inner border */}
        <div
          style={{
            position: "absolute",
            top: 30,
            left: 30,
            right: 30,
            bottom: 30,
            border: "1px solid #2B2D35",
            borderRadius: 4,
            display: "flex",
          }}
        />

        {/* wordmark */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={logoSrc}
          width={440}
          height={125}
          style={{ objectFit: "contain" }}
          alt="Lembraí"
        />

        {/* gold sparkle */}
        <div
          style={{
            width: 0,
            height: 0,
            marginTop: 20,
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <div
            style={{
              width: 14,
              height: 14,
              background: "#D2B266",
              transform: "rotate(45deg)",
              display: "flex",
            }}
          />
        </div>

        {/* gold divider line */}
        <div
          style={{
            width: 56,
            height: 1,
            background: "#D2B266",
            marginBottom: 20,
            display: "flex",
          }}
        />

        {/* subtitle */}
        <div
          style={{
            color: "#9A9DA6",
            fontSize: 13,
            letterSpacing: "5px",
            fontFamily: "sans-serif",
            textTransform: "uppercase",
            display: "flex",
          }}
        >
          FOTOS E VÍDEOS DO SEU EVENTO EM UM SÓ LUGAR
        </div>
      </div>
    ),
    { ...size }
  );
}
