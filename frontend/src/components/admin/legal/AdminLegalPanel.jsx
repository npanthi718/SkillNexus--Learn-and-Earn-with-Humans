import React, { useEffect } from "react";
import axios from "axios";
import LegalEditor from "../../admin/LegalEditor.jsx";

const AdminLegalPanel = ({ legalDocs, setLegalDocs, authHeaders }) => {
  useEffect(() => {
    const seed = async () => {
      const privacyDoc = (legalDocs || []).find((d) => d.type === "privacy");
      const termsDoc = (legalDocs || []).find((d) => d.type === "terms");
      const seedPrivacy = !privacyDoc || !privacyDoc.content;
      const seedTerms = !termsDoc || !termsDoc.content;
      if (!seedPrivacy && !seedTerms) return;
      const privacyContent = `
        <h2>Introduction</h2>
        <p>SkillNexus (“we”, “our”, “us”) provides a platform connecting learners with teachers worldwide. This Privacy Policy explains what data we collect, how we use it, and your rights.</p>
        <h2>Scope</h2>
        <p>This policy applies to all SkillNexus services, websites, mobile access, and communications.</p>
        <h2>Information We Collect</h2>
        <ul>
          <li><strong>Account</strong>: name, email, password (hashed), country, role</li>
          <li><strong>Profile</strong>: skills, biography, languages, links, avatar</li>
          <li><strong>Transactions</strong>: amounts, currencies, rates, payout details</li>
          <li><strong>Content</strong>: messages, session notes, reviews, complaints</li>
          <li><strong>Usage</strong>: device/browser data, IP, logs, timestamps</li>
          <li><strong>Cookies/Analytics</strong>: preferences, session and analytics identifiers</li>
        </ul>
        <h2>How We Use Information</h2>
        <ul>
          <li>Provide, secure, and improve the platform</li>
          <li>Process payments, payouts, currency conversions, and accounting</li>
          <li>Prevent fraud, abuse, and enforce policies</li>
          <li>Communicate service updates and support</li>
          <li>Comply with legal obligations</li>
        </ul>
        <h2>Legal Bases</h2>
        <ul>
          <li>Consent (where required)</li>
          <li>Contract performance (providing services)</li>
          <li>Legitimate interests (security, improvements)</li>
          <li>Legal compliance</li>
        </ul>
        <h2>Sharing</h2>
        <ul>
          <li>With service providers (hosting, analytics, communications, payment)</li>
          <li>With counter-parties as needed (e.g., teacher payout details)</li>
          <li>For legal requests, disputes, or business transfers</li>
        </ul>
        <h2>International Transfers</h2>
        <p>Data may be processed outside your country. We use appropriate safeguards consistent with applicable law.</p>
        <h2>Retention</h2>
        <p>We keep data only as long as necessary for services, accounting, and legal compliance, then delete or anonymize.</p>
        <h2>Your Rights</h2>
        <ul>
          <li>Access, rectify, delete</li>
          <li>Object or restrict processing</li>
          <li>Data portability</li>
          <li>Withdraw consent where applicable</li>
        </ul>
        <p>To exercise rights, contact support and we will respond within a reasonable timeframe.</p>
        <h2>Security</h2>
        <p>We implement technical and organizational measures to protect data against unauthorized access, loss, or misuse.</p>
        <h2>Children</h2>
        <p>SkillNexus is not intended for children under 13 (or applicable age). We remove data if collected inadvertently.</p>
        <h2>Cookies & Tracking</h2>
        <ul>
          <li>Strictly necessary (auth, session)</li>
          <li>Preferences (theme, language)</li>
          <li>Analytics (usage metrics)</li>
        </ul>
        <h2>Automated Decisions</h2>
        <p>We do not make automated decisions producing legal effects; limited automated checks may flag fraud risks.</p>
        <h2>Changes</h2>
        <p>We may update this policy. Significant changes will be notified in-app or by email.</p>
        <h2>Contact</h2>
        <p>Privacy inquiries: support@skillnexus.example.</p>
      `;
      const termsContent = `
        <h2>Acceptance</h2>
        <p>By using SkillNexus, you agree to these Terms and the Privacy Policy.</p>
        <h2>Eligibility & Accounts</h2>
        <ul>
          <li>You must provide accurate information and keep credentials secure.</li>
          <li>You are responsible for all activity under your account.</li>
        </ul>
        <h2>Platform Role</h2>
        <p>We provide a marketplace connecting learners and teachers. We are not a party to user-to-user arrangements beyond payment processing and policy enforcement.</p>
        <h2>Payments, Fees, Taxes</h2>
        <ul>
          <li>Learners pay the platform; a platform fee is deducted.</li>
          <li>Teachers receive payouts of the remainder.</li>
          <li>Currency conversion uses admin-configured rates; rates may vary.</li>
          <li>Users are responsible for taxes applicable to their earnings or purchases.</li>
        </ul>
        <h2>Payouts & Chargebacks</h2>
        <ul>
          <li>Payouts may require KYC and valid payout details.</li>
          <li>Chargebacks or disputes may result in holds, reversals, or deductions.</li>
        </ul>
        <h2>Sessions & Cancellations</h2>
        <ul>
          <li>Scheduling and reschedules occur in-app.</li>
          <li>Refunds or reassignments are handled via complaints and admin review.</li>
        </ul>
        <h2>Content</h2>
        <ul>
          <li>Users retain rights to their content.</li>
          <li>You grant us a limited license to host and display content to provide services.</li>
        </ul>
        <h2>Prohibited Conduct</h2>
        <ul>
          <li>No illegal, harmful, fraudulent, or infringing activities.</li>
          <li>No harassment, hate speech, or privacy violations.</li>
        </ul>
        <h2>Reviews & Ratings</h2>
        <p>Reviews must be honest and respectful. We may moderate for policy violations.</p>
        <h2>Disputes</h2>
        <p>Raise disputes through the complaints feature; admins may decide refunds or reassignments.</p>
        <h2>Disclaimer</h2>
        <p>Services are provided “as is” without warranties of outcomes.</p>
        <h2>Limitation of Liability</h2>
        <p>To the maximum extent permitted by law, we are not liable for indirect or consequential damages.</p>
        <h2>Indemnity</h2>
        <p>You agree to indemnify us against claims arising from your use or content.</p>
        <h2>Termination</h2>
        <p>We may suspend or terminate accounts for violations; you may delete your account at any time.</p>
        <h2>Governing Law</h2>
        <p>These Terms are governed by the laws of the jurisdiction where SkillNexus is operated.</p>
        <h2>Changes</h2>
        <p>We may update these Terms; significant changes will be notified.</p>
        <h2>Contact</h2>
        <p>Terms inquiries: support@skillnexus.example.</p>
      `;
      try {
        if (seedPrivacy) {
          await axios.put(`/api/admin/legal/privacy`, { title: "Privacy Policy", content: privacyContent }, { headers: authHeaders });
        }
        if (seedTerms) {
          await axios.put(`/api/admin/legal/terms`, { title: "Terms of Service", content: termsContent }, { headers: authHeaders });
        }
        const { data } = await axios.get("/api/admin/legal", { headers: authHeaders });
        setLegalDocs(data.legal || []);
      } catch (e) {}
    };
    seed();
  }, [legalDocs, setLegalDocs, authHeaders]);

  return (
    <div className="glass-card p-4">
      <h3 className="text-sm font-semibold mb-3">Privacy & Terms</h3>
      <p className="text-xs theme-muted mb-2">Edit legal documents shown to users.</p>
      <div className="flex gap-2">
        <a href="/legal/privacy" target="_blank" rel="noopener noreferrer" className="rounded border border-nexus-400/50 px-3 py-1 text-xs">View Privacy</a>
        <a href="/legal/terms" target="_blank" rel="noopener noreferrer" className="rounded border border-nexus-400/50 px-3 py-1 text-xs">View Terms</a>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={async () => {
            const title = "Privacy Policy";
            const content = `
              <h2>Introduction</h2>
              <p>SkillNexus (“we”, “our”, “us”) provides a platform connecting learners with teachers worldwide. This Privacy Policy explains data practices.</p>
              <h2>Information We Collect</h2>
              <ul>
                <li>Account and profile data</li>
                <li>Transactions and payout references</li>
                <li>Messages, reviews, complaints</li>
                <li>Device, IP, usage logs</li>
                <li>Cookies and analytics identifiers</li>
              </ul>
              <h2>Use of Data</h2>
              <ul>
                <li>Provide and improve services</li>
                <li>Payments, payouts, currency conversion</li>
                <li>Fraud prevention and security</li>
                <li>Legal compliance</li>
              </ul>
              <h2>Legal Bases</h2>
              <ul>
                <li>Consent</li>
                <li>Contract</li>
                <li>Legitimate interests</li>
                <li>Compliance</li>
              </ul>
              <h2>Sharing</h2>
              <p>Service providers, counterparties where required, legal requests.</p>
              <h2>International Transfers</h2>
              <p>Safeguards used consistent with applicable law.</p>
              <h2>Retention</h2>
              <p>Held only as long as necessary, then deleted or anonymized.</p>
              <h2>Your Rights</h2>
              <ul>
                <li>Access, rectification, deletion</li>
                <li>Objection or restriction</li>
                <li>Portability</li>
                <li>Withdraw consent</li>
              </ul>
              <h2>Security</h2>
              <p>Technical and organizational measures protect your data.</p>
              <h2>Children</h2>
              <p>Not intended for under 13; data removed if collected inadvertently.</p>
              <h2>Cookies</h2>
              <ul>
                <li>Necessary, preferences, analytics</li>
              </ul>
              <h2>Changes</h2>
              <p>We may update and notify significant changes.</p>
              <h2>Contact</h2>
              <p>support@skillnexus.example.</p>
            `;
            try {
              const { data } = await axios.put(`/api/admin/legal/privacy`, { title, content }, { headers: authHeaders });
              setLegalDocs((prev) => {
                const next = Array.isArray(prev) ? [...prev] : [];
                const idx = next.findIndex((x) => x.type === "privacy");
                if (idx >= 0) next[idx] = data;
                else next.push(data);
                return next;
              });
            } catch (e) {}
          }}
          className="rounded border border-amber-500/40 bg-amber-500/20 px-3 py-1 text-[11px]"
        >
          Load recommended Privacy
        </button>
        <button
          type="button"
          onClick={async () => {
            const title = "Terms of Service";
            const content = `
              <h2>Acceptance</h2>
              <p>By using SkillNexus, you agree to these Terms and Privacy Policy.</p>
              <h2>Accounts</h2>
              <ul>
                <li>Accurate information required; credentials must be protected.</li>
                <li>You are responsible for activity under your account.</li>
              </ul>
              <h2>Payments & Fees</h2>
              <ul>
                <li>Learners pay platform; teachers receive remainder after fees.</li>
                <li>FX conversion uses admin-configured rates; may vary.</li>
              </ul>
              <h2>Sessions</h2>
              <ul>
                <li>Scheduling handled in-app; cancellations and reschedules allowed per policy.</li>
                <li>Refunds/reassignments via complaints and admin review.</li>
              </ul>
              <h2>Content & Conduct</h2>
              <ul>
                <li>No illegal, harmful, fraudulent, infringing content or behavior.</li>
              </ul>
              <h2>IP & License</h2>
              <p>Users retain rights; limited license to host/display for service provision.</p>
              <h2>Disputes</h2>
              <p>Use complaints feature; admin decisions may include refunds or reassignments.</p>
              <h2>Disclaimer</h2>
              <p>Services provided “as is”.</p>
              <h2>Liability</h2>
              <p>We are not liable for indirect or consequential damages to the extent permitted by law.</p>
              <h2>Indemnity</h2>
              <p>You agree to indemnify for claims arising from your use or content.</p>
              <h2>Termination</h2>
              <p>We may suspend/terminate for violations; you may delete account.</p>
              <h2>Governing Law</h2>
              <p>Jurisdiction where SkillNexus operates.</p>
              <h2>Changes</h2>
              <p>Terms may be updated; significant changes notified.</p>
              <h2>Contact</h2>
              <p>support@skillnexus.example.</p>
            `;
            try {
              const { data } = await axios.put(`/api/admin/legal/terms`, { title, content }, { headers: authHeaders });
              setLegalDocs((prev) => {
                const next = Array.isArray(prev) ? [...prev] : [];
                const idx = next.findIndex((x) => x.type === "terms");
                if (idx >= 0) next[idx] = data;
                else next.push(data);
                return next;
              });
            } catch (e) {}
          }}
          className="rounded border border-emerald-500/40 bg-emerald-500/20 px-3 py-1 text-[11px]"
        >
          Load recommended Terms
        </button>
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {["privacy", "terms"].map((type) => {
          const doc = (legalDocs || []).find((d) => d.type === type) || { title: "", content: "" };
          return (
            <div key={type}>
              <p className="text-xs font-semibold mb-2">{type === "privacy" ? "Privacy Policy" : "Terms & Conditions"}</p>
              <LegalEditor
                type={type}
                doc={doc}
                authHeaders={authHeaders}
                onSaved={(data) => {
                  setLegalDocs((prev) => {
                    const next = Array.isArray(prev) ? [...prev] : [];
                    const idx = next.findIndex((x) => x.type === type);
                    if (idx >= 0) next[idx] = data;
                    else next.push(data);
                    return next;
                  });
                }}
              />
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AdminLegalPanel;
