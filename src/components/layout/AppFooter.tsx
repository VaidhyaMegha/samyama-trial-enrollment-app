export function AppFooter() {
  return (
    <footer className="border-t bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 px-6 py-4">
        {/* Left side - Copyright and app name */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>© {new Date().getFullYear()} Trial Compass Pro</span>
          <span className="hidden md:inline">•</span>
          <span className="hidden md:inline">All rights reserved</span>
        </div>

        {/* Center - Samyama.ai branding */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Powered by</span>
          <a
            href="https://samyama.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 transition-opacity hover:opacity-80"
          >
            <img
              src="/branding/samyama_light_bg.png"
              alt="Samyama.ai"
              className="h-5 w-auto dark:hidden"
            />
            <img
              src="/branding/samyama_darkmode_bg.png"
              alt="Samyama.ai"
              className="h-5 w-auto hidden dark:block"
            />
          </a>
        </div>

        {/* Right side - Links */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <a
            href="https://samyama.ai/about"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            About
          </a>
          <span>•</span>
          <a
            href="https://samyama.ai/contact"
            target="_blank"
            rel="noopener noreferrer"
            className="transition-colors hover:text-foreground"
          >
            Contact
          </a>
        </div>
      </div>
    </footer>
  );
}
