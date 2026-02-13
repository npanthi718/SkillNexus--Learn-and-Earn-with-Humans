import React, { useRef, useEffect, useState } from "react";
import axios from "axios";

// Toolbar button rendered inline to preserve editor selection

const LegalEditor = ({ type, doc, authHeaders, onSaved }) => {
  const editorRef = useRef(null);
  const [title, setTitle] = useState(doc?.title || "");
  const [html, setHtml] = useState(doc?.content || "");
  useEffect(() => {
    setTitle(doc?.title || "");
    setHtml(doc?.content || "");
  }, [doc?.title, doc?.content]);

  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");
  const save = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const content = editorRef.current?.innerHTML || "";
      const { data } = await axios.put(`/api/admin/legal/${type}`, { title, content }, { headers: authHeaders });
      onSaved && onSaved(data);
      setSaveMsg("Saved");
    } catch (e) {
      setSaveMsg(e.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMsg(""), 2500);
    }
  };

  const exec = (cmd, arg, ask) => {
    const ed = editorRef.current;
    if (!ed) return;
    ed.focus();
    try {
      document.execCommand("styleWithCSS", false, true);
      if (ask === "link") {
        const url = window.prompt("Enter URL");
        if (!url) return;
        document.execCommand("createLink", false, url);
        return;
      }
      document.execCommand(cmd, false, arg);
    } catch (e) {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-white/10 bg-black/20 p-3">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        className="mb-2 w-full rounded bg-black/40 px-2 py-1 text-sm outline-none"
      />
      <div className="mb-2">
        <button type="button" title="Bold" onMouseDown={(e) => { e.preventDefault(); exec("bold"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">🅱️</button>
        <button type="button" title="Italic" onMouseDown={(e) => { e.preventDefault(); exec("italic"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">𝘐</button>
        <button type="button" title="Underline" onMouseDown={(e) => { e.preventDefault(); exec("underline"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">U̲</button>
        <button type="button" title="Clear formatting" onMouseDown={(e) => { e.preventDefault(); exec("removeFormat"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">⟲</button>
        <button type="button" title="Bulleted list" onMouseDown={(e) => { e.preventDefault(); exec("insertUnorderedList"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">• • •</button>
        <button type="button" title="Numbered list" onMouseDown={(e) => { e.preventDefault(); exec("insertOrderedList"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">1. 2. 3.</button>
        <button type="button" title="Heading 2" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "h2"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">H2</button>
        <button type="button" title="Heading 3" onMouseDown={(e) => { e.preventDefault(); exec("formatBlock", "h3"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">H3</button>
        <button type="button" title="Align left" onMouseDown={(e) => { e.preventDefault(); exec("justifyLeft"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">⇤</button>
        <button type="button" title="Align center" onMouseDown={(e) => { e.preventDefault(); exec("justifyCenter"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">↔</button>
        <button type="button" title="Align right" onMouseDown={(e) => { e.preventDefault(); exec("justifyRight"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">⇥</button>
        <button type="button" title="Insert link" onMouseDown={(e) => { e.preventDefault(); exec("createLink", null, "link"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">🔗</button>
        <button type="button" title="Separator" onMouseDown={(e) => { e.preventDefault(); exec("insertHorizontalRule"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">—</button>
        <button type="button" title="Undo" onMouseDown={(e) => { e.preventDefault(); exec("undo"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">↶</button>
        <button type="button" title="Redo" onMouseDown={(e) => { e.preventDefault(); exec("redo"); }} className="rounded border border-white/20 bg-black/30 hover:bg-black/40 px-2 py-1 text-[11px] mr-1">↷</button>
        <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={save} className="rounded border border-emerald-400/50 bg-emerald-500/20 px-3 py-1 text-[11px] text-emerald-200 ml-2 disabled:opacity-60" disabled={saving}>{saving ? "Saving..." : "Save"}</button>
        {saveMsg && <span className="ml-2 text-[11px]">{saveMsg}</span>}
      </div>
      <div
        ref={editorRef}
        contentEditable
        dangerouslySetInnerHTML={{ __html: html }}
        className="min-h-[220px] w-full rounded bg-black/30 px-3 py-2 text-sm outline-none leading-relaxed"
        onInput={(e) => setHtml(e.currentTarget.innerHTML)}
      />
    </div>
  );
};

export default LegalEditor;
