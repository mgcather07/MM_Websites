import Nav from "@/components/Nav";
import Footer from "@/components/Footer";
import AnchorScroll from "@/components/AnchorScroll";
import ScrollProgress from "@/components/ScrollProgress";

// Shared chrome for the marketing pages (Home, Services, Work, Process,
// Contact). The /quote and /nda document pages live outside this group, so
// they intentionally have no nav or footer.
export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <ScrollProgress />
      <AnchorScroll />
      <a href="#main" className="visually-hidden-focusable">
        Skip to content
      </a>
      <Nav />
      <main id="main">{children}</main>
      <Footer />
    </>
  );
}
