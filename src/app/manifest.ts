import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "2027 中歐旅行",
    short_name: "中歐旅行",
    description: "旅伴共同編輯的中歐旅行工作台",
    start_url: "/trip/central-europe-2027/today",
    display: "standalone",
    background_color: "#f5f5f2",
    theme_color: "#1f6a4a",
    lang: "zh-Hant",
    icons: [
      { src: "/app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      { src: "/app-icon-maskable.svg", sizes: "any", type: "image/svg+xml", purpose: "maskable" },
    ],
  };
}
