import type { Metadata } from "next";
import { Fraunces, Space_Grotesk } from "next/font/google";
import "./globals.css";

const themeBootstrapScript = `
(() => {
  const storageKey = "theme-preference";
  const root = document.documentElement;
  const stored = window.localStorage.getItem(storageKey);
  const preferredTheme =
    stored === "light" || stored === "dark" ? stored : null;
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
  const nextTheme = preferredTheme ?? systemTheme;

  root.dataset.theme = nextTheme;
  root.style.colorScheme = nextTheme;
})();
`;

const bodyFont = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
});

const headingFont = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ITPEC IP Exam Reviewer",
  description: "Practice, review, and mock exam app powered by past IP exam papers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${bodyFont.variable} ${headingFont.variable} antialiased`}>
        <script dangerouslySetInnerHTML={{ __html: themeBootstrapScript }} />
        {children}
      </body>
    </html>
  );
}
