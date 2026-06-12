import { ImageResponse } from "next/og";

export const alt = "Lembraí — Álbum digital para eventos com QR Code";
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: "#f6efe7",
          color: "#261f2d",
          fontFamily: "Arial, sans-serif",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background:
              "radial-gradient(circle at 82% 20%, rgba(240,111,79,0.35), transparent 28%), radial-gradient(circle at 76% 82%, rgba(36,91,60,0.20), transparent 26%)",
          }}
        />
        <div
          style={{
            position: "absolute",
            left: 760,
            top: 92,
            width: 320,
            height: 420,
            borderRadius: 42,
            background: "#261f2d",
            display: "flex",
            flexDirection: "column",
            padding: 30,
            color: "white",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              fontSize: 22,
              color: "rgba(255,255,255,0.64)",
            }}
          >
            <span>Painel do evento</span>
            <span style={{ color: "#ffd7a4" }}>ao vivo</span>
          </div>
          <div
            style={{
              marginTop: 30,
              display: "flex",
              flexWrap: "wrap",
              gap: 14,
            }}
          >
            {["327", "42", "86", "QR"].map((item, index) => (
              <div
                key={item}
                style={{
                  width: 120,
                  height: 112,
                  borderRadius: 24,
                  background:
                    index === 3 ? "#ffd7a4" : "rgba(255,255,255,0.10)",
                  color: index === 3 ? "#261f2d" : "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 42,
                  fontWeight: 800,
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            style={{
              marginTop: 28,
              borderRadius: 22,
              background: "#f06f4f",
              height: 70,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            Download completo
          </div>
        </div>
        <div
          style={{
            position: "relative",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            padding: "72px 88px",
            width: 760,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
              fontSize: 30,
              fontWeight: 800,
            }}
          >
            <div
              style={{
                width: 54,
                height: 54,
                borderRadius: 18,
                background: "#261f2d",
                color: "#ffd7a4",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              L
            </div>
            Lembraí
          </div>
          <h1
            style={{
              margin: "48px 0 0",
              fontSize: 68,
              lineHeight: 1.02,
              letterSpacing: -3,
              fontWeight: 900,
            }}
          >
            Álbum digital para eventos com QR Code
          </h1>
          <p
            style={{
              margin: "26px 0 0",
              fontSize: 28,
              lineHeight: 1.35,
              color: "#6d5f58",
            }}
          >
            Receba fotos e vídeos dos convidados em tempo real, sem app e em um
            painel privado.
          </p>
          <div
            style={{
              marginTop: 42,
              display: "flex",
              gap: 16,
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            <span
              style={{
                borderRadius: 999,
                background: "#f06f4f",
                color: "white",
                padding: "16px 24px",
              }}
            >
              R$ 199 por evento
            </span>
            <span
              style={{
                borderRadius: 999,
                background: "white",
                color: "#245b3c",
                padding: "16px 24px",
              }}
            >
              QR Code pronto na hora
            </span>
          </div>
        </div>
      </div>
    ),
    size
  );
}
