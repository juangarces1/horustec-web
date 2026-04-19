import type { NextConfig } from "next";

// Upstream del backend .NET (server viejo, misma máquina en LAN que Next.js).
// Usamos localhost porque Next.js corre en el MISMO server que el API.
const apiUpstream = process.env.API_UPSTREAM ?? "http://localhost:8087";

const nextConfig: NextConfig = {
  // Proxy de rutas del backend al API .NET. El browser hace fetch a mismo
  // origen → Next.js server-side forwarda. Así la URL del API nunca queda
  // hardcoded en el bundle del cliente: funciona igual desde LAN
  // (http://192.168.1.3:3000) e internet (https://app.estacionsangerardo.com
  // via Cloudflare Tunnel).
  async rewrites() {
    return [
      { source: "/api/:path*", destination: `${apiUpstream}/api/:path*` },
      { source: "/hubs/:path*", destination: `${apiUpstream}/hubs/:path*` },
      { source: "/uploads/:path*", destination: `${apiUpstream}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
