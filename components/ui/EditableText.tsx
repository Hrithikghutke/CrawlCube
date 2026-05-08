"use client";

import { useRef, useState } from "react";
import { Pencil } from "lucide-react";

type ValidTags = "span" | "h1" | "h2" | "h3" | "h4" | "p" | "div";

export default function EditableText({
  value,
  onSave,
  as: Tag = "span",
  className = "",
  style = {},
  multiline = false,
}: {
  value: string;
  onSave: (newValue: string) => void;
  as?: ValidTags;
  className?: string;
  style?: React.CSSProperties;
  multiline?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const originalValue = useRef(value);

  const startEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    setEditing(true);
    originalValue.current = value;
    setTimeout(() => {
      if (ref.current) {
        ref.current.focus();
        const range = document.createRange();
        range.selectNodeContents(ref.current);
        const sel = window.getSelection();
        sel?.removeAllRanges();
        sel?.addRange(range);
      }
    }, 0);
  };

  const handleBlur = () => {
    setEditing(false);
    const newValue = ref.current?.innerText?.trim() ?? "";
    if (newValue && newValue !== originalValue.current) {
      onSave(newValue);
    } else if (!newValue && ref.current) {
      ref.current.innerText = originalValue.current;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      if (ref.current) ref.current.innerText = originalValue.current;
      setEditing(false);
      ref.current?.blur();
    }
    if (e.key === "Enter" && !multiline) {
      e.preventDefault();
      ref.current?.blur();
    }
  };

  const TagName = Tag as any;

  return (
    // group: CSS hover state shared between text + pencil
    <span className="group/edit relative inline-block">
      {/* Pencil trigger — div not button, avoids nested button error */}
      {!editing && (
        <span
          onClick={startEdit}
          title="Edit text"
          className="
            absolute -top-2 -right-7 z-50
            w-5 h-5 rounded-full
            flex items-center justify-center
            shadow-lg cursor-pointer
            opacity-0 group-hover/edit:opacity-100
            transition-opacity duration-150
          "
          style={{ background: "#7c3aed", border: "1.5px solid #a78bfa" }}
        >
          <Pencil className="w-2.5 h-2.5 text-white" />
        </span>
      )}

      {/* Invisible bridge between text and pencil so hover doesn't drop */}
      {!editing && (
        <span
          className="absolute -top-2 -right-7 w-8 h-8 opacity-0"
          style={{ pointerEvents: "all" }}
        />
      )}

      <TagName
        ref={ref}
        className={`
          ${className}
          ${
            editing
              ? "outline-none ring-2 ring-purple-500/60 rounded px-1 bg-purple-500/5"
              : "group-hover/edit:underline group-hover/edit:decoration-dotted group-hover/edit:decoration-purple-400 group-hover/edit:underline-offset-2 cursor-text"
          }
        `}
        style={{
          ...style,
          whiteSpace: multiline ? "pre-wrap" : undefined,
        }}
        contentEditable={editing}
        suppressContentEditableWarning
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        onClick={!editing ? startEdit : undefined}
      >
        {value}
      </TagName>
    </span>
  );
}
