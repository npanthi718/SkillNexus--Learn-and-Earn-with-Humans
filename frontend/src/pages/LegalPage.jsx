import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";

const LegalPage = () => {
  const { type } = useParams();
  const navigate = useNavigate();
  const [doc, setDoc] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!["privacy", "terms"].includes(type)) {
      navigate("/");
      return;
    }
    axios
      .get(`/api/platform/legal/${type}`)
      .then(({ data }) => setDoc(data))
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [type, navigate]);

  if (loading) return <main className="flex flex-1 items-center justify-center"><p className="text-sm theme-muted">Loading...</p></main>;
  if (!doc) return <main className="flex flex-1 items-center justify-center"><p className="text-sm theme-muted">Not found</p></main>;

  return (
    <main className="mx-auto max-w-4xl flex-1 px-4 py-8">
      <button type="button" onClick={() => navigate(-1)} className="mb-4 text-sm theme-muted hover:theme-primary">← Back</button>
      <article className="glass-card p-8 prose prose-invert max-w-none leading-relaxed">
        <h1 className="text-2xl font-bold theme-accent">{doc.title || (type === "privacy" ? "Privacy Policy" : "Terms of Service")}</h1>
        <style>
          {`
            .legal-content ul { list-style: disc; margin-left: 1.25rem; margin-bottom: .5rem; }
            .legal-content ol { list-style: decimal; margin-left: 1.25rem; margin-bottom: .5rem; }
            .legal-content h2 { font-weight: 600; margin-top: 1rem; margin-bottom: .5rem; }
            .legal-content p, .legal-content li { line-height: 1.6; }
            .legal-content hr { border-color: rgba(255,255,255,0.15); }
          `}
        </style>
        <div
          className="legal-content mt-4 text-[15px] theme-primary"
          dangerouslySetInnerHTML={{ __html: doc.content || "<p>No content available.</p>" }}
        />
      </article>
    </main>
  );
};

export default LegalPage;
