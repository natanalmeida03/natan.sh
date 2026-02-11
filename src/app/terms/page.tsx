import Link from "next/link";

export default function TermsOfService() {
  return (
    <div className="bg-background min-h-dvh flex">
      <main className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-4xl mx-auto flex flex-col py-6 sm:py-16">
        {/* Header */}
        <div className="flex gap-3 sm:gap-4 items-center justify-between mb-8 sm:mb-12">
          <h1 className="text-foreground font-mono text-sm sm:text-base">
            <b>terms</b>@ubuntu:~$
          </h1>
          <Link
            href="/"
            className="font-mono text-sm text-muted hover:text-foreground transition-colors"
          >
            cd ~
          </Link>
        </div>

        {/* Content */}
        <div className="flex flex-col gap-6 sm:gap-8 text-sm sm:text-base">
          <div>
            <p className="text-accent font-bold mb-3">
              <span className="text-muted">$</span> cat terms_of_service.txt
            </p>
            <p className="text-muted text-xs sm:text-sm">
              Last updated: February 11, 2025
            </p>
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 1. Acceptance of Terms
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              By accessing and using natan.sh, you agree to these Terms of
              Service. If you do not agree with any of these terms, do not use
              the service.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 2. Service Description
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              natan.sh is a personal productivity platform that offers reminder
              management, habit tracking, and daily notes. The service includes
              optional integration with Google Calendar for event
              synchronization.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 3. User Accounts
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom flex flex-col gap-2">
              <p>
                You are responsible for maintaining the security of your account
                and password. You agree to:
              </p>
              <ul className="list-none flex flex-col gap-1 pl-2">
                <li>
                  <span className="text-muted mr-2">-</span>Provide accurate
                  and complete information
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Keep your
                  credentials secure
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Notify us
                  immediately of any unauthorized use
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 4. Acceptable Use
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom flex flex-col gap-2">
              <p>You agree not to:</p>
              <ul className="list-none flex flex-col gap-1 pl-2">
                <li>
                  <span className="text-muted mr-2">-</span>Use the service for
                  illegal purposes
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Attempt to access
                  other users&apos; accounts
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Interfere with the
                  operation of the service
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Reverse engineer or
                  exploit vulnerabilities
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 5. Third-Party Integrations
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              The service may integrate with third-party services such as Google
              Calendar and Supabase. Use of these integrations is subject to the
              respective providers&apos; terms of service. We are not responsible
              for interruptions or changes in those external services.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 6. Intellectual Property
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              The content you create (reminders, notes, habits) belongs to you.
              The source code, design, and brand of natan.sh are the property of
              the developer.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 7. Service Availability
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              The service is provided &quot;as is&quot;. We do not guarantee
              uninterrupted availability and may modify, suspend, or discontinue
              the service at any time, with prior notice when possible.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 8. Limitation of Liability
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              Under no circumstances shall we be liable for indirect, incidental,
              or consequential damages arising from the use or inability to use
              the service.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 9. Termination
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              We may terminate or suspend your access to the service at any time,
              for any reason, including violation of these terms. You may delete
              your account at any time.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 10. Changes to Terms
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              We reserve the right to modify these terms at any time. Significant
              changes will be communicated through the service. Continued use
              after changes constitutes acceptance of the new terms.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 11. Contact
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              For questions about these terms, please reach out via the email
              available on the developer&apos;s profile.
            </p>
          </section>

          {/* Footer */}
          <div className="mt-4 pt-6 border-t border-border-custom flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between text-xs text-muted font-mono">
            <p>
              <span className="text-muted">$</span> echo
              &quot;EOF&quot;
            </p>
            <div className="flex gap-4">
              <Link
                href="/privacy"
                className="hover:text-foreground transition-colors"
              >
                privacy_policy
              </Link>
              <Link
                href="/"
                className="hover:text-foreground transition-colors"
              >
                home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
