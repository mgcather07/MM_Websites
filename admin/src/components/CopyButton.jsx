import { useState } from "react";

/**
 * A button that copies `text` to the clipboard and briefly confirms.
 * Falls back gracefully if the clipboard API is unavailable.
 */
export default function CopyButton({
  text,
  label = "Copy link",
  copiedLabel = "Copied!",
  className = "btn btn-outline btn-sm",
}) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
    } catch {
      // Older/insecure contexts: fall back to a hidden textarea.
      try {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      } catch {
        return;
      }
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <button type="button" className={className} onClick={copy}>
      {copied ? copiedLabel : label}
    </button>
  );
}
