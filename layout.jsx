import "./globals.css";

export const metadata = {
  title: "SDM Dinsos",
  description: "Aplikasi pelengkap data SDM Dinas Sosial",
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
