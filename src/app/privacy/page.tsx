import Link from "next/link";

export default function PrivacyPolicy() {
  return (
    <div className="bg-background min-h-dvh flex">
      <main className="bg-background w-full max-w-[95%] sm:max-w-10/12 xl:max-w-4xl mx-auto flex flex-col py-6 sm:py-16">
        {/* Header */}
        <div className="flex gap-3 sm:gap-4 items-center justify-between mb-8 sm:mb-12">
          <h1 className="text-foreground font-mono text-sm sm:text-base">
            <b>privacy</b>@ubuntu:~$
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
              <span className="text-muted">$</span> cat privacy_policy.txt
            </p>
            <p className="text-muted text-xs sm:text-sm">
              Last updated: February 11, 2025
            </p>
          </div>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 1. Information We Collect
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom flex flex-col gap-3">
              <div>
                <p className="font-bold text-foreground/90 mb-1">
                  <span className="text-muted mr-2">##</span>Account Data
                </p>
                <ul className="list-none flex flex-col gap-1 pl-2">
                  <li>
                    <span className="text-muted mr-2">-</span>Email and username
                    (on registration)
                  </li>
                  <li>
                    <span className="text-muted mr-2">-</span>Google profile
                    information (when using social login)
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-foreground/90 mb-1">
                  <span className="text-muted mr-2">##</span>Usage Data
                </p>
                <ul className="list-none flex flex-col gap-1 pl-2">
                  <li>
                    <span className="text-muted mr-2">-</span>Reminders, habits,
                    and notes you create
                  </li>
                  <li>
                    <span className="text-muted mr-2">-</span>App settings and
                    preferences
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-bold text-foreground/90 mb-1">
                  <span className="text-muted mr-2">##</span>Integration Tokens
                </p>
                <ul className="list-none flex flex-col gap-1 pl-2">
                  <li>
                    <span className="text-muted mr-2">-</span>Google OAuth
                    tokens (for Google Calendar sync)
                  </li>
                  <li>
                    <span className="text-muted mr-2">-</span>These tokens are
                    stored securely and used exclusively for event
                    synchronization
                  </li>
                </ul>
              </div>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 2. How We Use Your Data
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              <ul className="list-none flex flex-col gap-1 pl-2">
                <li>
                  <span className="text-muted mr-2">-</span>Provide and maintain
                  the service
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Send reminder
                  notifications (when enabled)
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Sync events with
                  Google Calendar (when authorized)
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Improve the user
                  experience
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 3. Google Calendar
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom flex flex-col gap-2">
              <p>
                When you connect your Google account, we request access to the{" "}
                <code className="text-accent bg-surface px-1.5 py-0.5 rounded text-xs sm:text-sm">
                  calendar.events
                </code>{" "}
                scope to:
              </p>
              <ul className="list-none flex flex-col gap-1 pl-2">
                <li>
                  <span className="text-muted mr-2">-</span>Create events in
                  your calendar when adding reminders
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Update events when
                  you edit reminders
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Remove events when
                  you delete reminders
                </li>
              </ul>
              <p>
                You can disconnect Google Calendar at any time in your profile
                settings. Upon disconnecting, your tokens are immediately removed
                from our database.
              </p>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 4. Storage and Security
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom flex flex-col gap-2">
              <p>
                Your data is stored on Supabase with the following security
                measures:
              </p>
              <ul className="list-none flex flex-col gap-1 pl-2">
                <li>
                  <span className="text-muted mr-2">-</span>Row Level Security
                  (RLS) — each user can only access their own data
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Encrypted
                  connections via HTTPS
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>OAuth tokens stored
                  with restricted access
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Passwords are never
                  stored in plain text
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 5. Data Sharing
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom flex flex-col gap-2">
              <p>
                We do not sell, rent, or share your personal data with third
                parties, except:
              </p>
              <ul className="list-none flex flex-col gap-1 pl-2">
                <li>
                  <span className="text-muted mr-2">-</span>Google — only the
                  data necessary for Calendar synchronization
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Supabase — as our
                  infrastructure provider
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Resend — for
                  sending notification emails
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 6. Your Rights
            </h2>
            <div className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              <ul className="list-none flex flex-col gap-1 pl-2">
                <li>
                  <span className="text-muted mr-2">-</span>Access all your data
                  at any time
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Edit or correct your
                  information
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Delete your account
                  and all associated data
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Disconnect
                  third-party integrations
                </li>
                <li>
                  <span className="text-muted mr-2">-</span>Export your data
                </li>
              </ul>
            </div>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 7. Cookies and Local Storage
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              We use cookies for authentication and localStorage for theme
              preferences. We do not use tracking cookies or third-party
              analytics.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 8. Changes to this Policy
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              We may update this policy periodically. Significant changes will be
              communicated through the service. We recommend reviewing this page
              regularly.
            </p>
          </section>

          <section className="flex flex-col gap-2">
            <h2 className="text-foreground font-bold">
              <span className="text-muted">#</span> 9. Contact
            </h2>
            <p className="text-foreground/80 leading-relaxed pl-4 border-l-2 border-border-custom">
              For privacy-related questions, please reach out via the email
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
                href="/terms"
                className="hover:text-foreground transition-colors"
              >
                terms_of_service
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
