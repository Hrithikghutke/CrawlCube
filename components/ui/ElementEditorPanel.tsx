"use client";

import React, { useState, useEffect } from "react";
import {
  X,
  Type,
  PaintBucket,
  Maximize,
  Code,
  GripHorizontal,
  Link as LinkIcon,
  Unlink,
  AlignHorizontalSpaceAround,
  Settings2,
  Square,
  Image as ImageIcon,
} from "lucide-react";

const SliderInput = ({
  label,
  value,
  onChange,
  min = 0,
  max = 100,
  defaultUnit = "px",
  step = 1,
}: any) => {
  const numMatch = (value || "").toString().match(/^-?\d*\.?\d+/);
  const numValue = numMatch ? parseFloat(numMatch[0]) : 0;
  let unit =
    (value || "")
      .toString()
      .replace(/^-?\d*\.?\d+/, "")
      .trim() || defaultUnit;
  if (!["px", "rem", "em", "%", "vw", "vh", ""].includes(unit))
    unit = defaultUnit;

  const handleChange = (newVal: string | number) =>
    onChange(`${newVal}${unit}`);

  return (
    <div>
      <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5 flex justify-between">
        <span>{label}</span>
      </label>
      <div className="flex gap-2 items-center">
        <input
          type="range"
          min={min}
          max={max}
          value={numValue}
          onChange={(e) => handleChange(e.target.value)}
          className="flex-1 h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
        />
        <div className="flex items-center bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md overflow-hidden w-20 shadow-sm">
          <input
            type="number"
            value={numValue}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full bg-transparent px-2 py-1 text-xs outline-none text-right text-neutral-800 dark:text-neutral-200 font-mono"
            step={step}
          />
          <span className="text-[10px] text-neutral-400 pr-1.5">{unit}</span>
        </div>
      </div>
    </div>
  );
};

const SpacingControl = ({
  type,
  label,
  styles,
  onChange,
}: {
  type: "margin" | "padding" | "radius";
  label: string;
  styles: any;
  onChange: (k: string, v: string) => void;
}) => {
  const [linkMode, setLinkMode] = useState<"all" | "axis" | "none">("all");
  const baseKey = type === "radius" ? "borderRadius" : type;
  const uniformValue = styles[baseKey] || "0px";

  const toggleLink = () => {
    if (type === "radius") setLinkMode(linkMode === "all" ? "none" : "all");
    else
      setLinkMode(
        linkMode === "all" ? "axis" : linkMode === "axis" ? "none" : "all",
      );
  };

  const renderIcon = () => {
    if (linkMode === "all")
      return (
        <div className="flex items-center gap-1">
          <LinkIcon className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-wider font-bold">
            All
          </span>
        </div>
      );
    if (linkMode === "axis")
      return (
        <div className="flex items-center gap-1">
          <AlignHorizontalSpaceAround className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-wider font-bold">
            Axis
          </span>
        </div>
      );
    return (
      <div className="flex items-center gap-1">
        <Unlink className="w-3.5 h-3.5" />
        <span className="text-[9px] uppercase tracking-wider font-bold">
          Split
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm">
      <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800/50 mb-1">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </span>
        <button
          onClick={toggleLink}
          className="text-neutral-400 hover:text-blue-500 transition-colors flex items-center"
        >
          {renderIcon()}
        </button>
      </div>

      <div className="space-y-3.5">
        {linkMode === "all" && (
          <SliderInput
            label="Uniform (All Sides)"
            value={uniformValue}
            min={0}
            max={type === "radius" ? 150 : 200}
            onChange={(v: string) => onChange(baseKey, v)}
          />
        )}

        {linkMode === "axis" && type !== "radius" && (
          <>
            <SliderInput
              label="Vertical (Top & Bottom)"
              value={styles[`${type}Top`] || uniformValue}
              min={0}
              max={200}
              onChange={(v: string) => {
                onChange(`${type}Top`, v);
                onChange(`${type}Bottom`, v);
              }}
            />
            <SliderInput
              label="Horizontal (Left & Right)"
              value={styles[`${type}Left`] || uniformValue}
              min={0}
              max={200}
              onChange={(v: string) => {
                onChange(`${type}Left`, v);
                onChange(`${type}Right`, v);
              }}
            />
          </>
        )}

        {linkMode === "none" && type !== "radius" && (
          <>
            <SliderInput
              label="Top"
              value={styles[`${type}Top`] || uniformValue}
              min={0}
              max={200}
              onChange={(v: string) => onChange(`${type}Top`, v)}
            />
            <SliderInput
              label="Right"
              value={styles[`${type}Right`] || uniformValue}
              min={0}
              max={200}
              onChange={(v: string) => onChange(`${type}Right`, v)}
            />
            <SliderInput
              label="Bottom"
              value={styles[`${type}Bottom`] || uniformValue}
              min={0}
              max={200}
              onChange={(v: string) => onChange(`${type}Bottom`, v)}
            />
            <SliderInput
              label="Left"
              value={styles[`${type}Left`] || uniformValue}
              min={0}
              max={200}
              onChange={(v: string) => onChange(`${type}Left`, v)}
            />
          </>
        )}

        {linkMode === "none" && type === "radius" && (
          <>
            <SliderInput
              label="Top Left Radius"
              value={styles.borderTopLeftRadius || uniformValue}
              min={0}
              max={150}
              onChange={(v: string) => onChange("borderTopLeftRadius", v)}
            />
            <SliderInput
              label="Top Right Radius"
              value={styles.borderTopRightRadius || uniformValue}
              min={0}
              max={150}
              onChange={(v: string) => onChange("borderTopRightRadius", v)}
            />
            <SliderInput
              label="Bottom Right Radius"
              value={styles.borderBottomRightRadius || uniformValue}
              min={0}
              max={150}
              onChange={(v: string) => onChange("borderBottomRightRadius", v)}
            />
            <SliderInput
              label="Bottom Left Radius"
              value={styles.borderBottomLeftRadius || uniformValue}
              min={0}
              max={150}
              onChange={(v: string) => onChange("borderBottomLeftRadius", v)}
            />
          </>
        )}
      </div>
    </div>
  );
};

const BorderControl = ({
  styles,
  onChange,
}: {
  styles: any;
  onChange: (k: string, v: string) => void;
}) => {
  const [linkMode, setLinkMode] = useState<"all" | "none">("all");

  const toggleLink = () => setLinkMode(linkMode === "all" ? "none" : "all");
  const uniformWidth = styles.borderWidth || "0px";
  const uniformStyle = styles.borderStyle || "none";
  const uniformColor = styles.borderColor || "#cccccc";

  const renderIcon = () => {
    if (linkMode === "all")
      return (
        <div className="flex items-center gap-1">
          <LinkIcon className="w-3.5 h-3.5" />
          <span className="text-[9px] uppercase tracking-wider font-bold">
            All
          </span>
        </div>
      );
    return (
      <div className="flex items-center gap-1">
        <Unlink className="w-3.5 h-3.5" />
        <span className="text-[9px] uppercase tracking-wider font-bold">
          Split
        </span>
      </div>
    );
  };

  return (
    <div className="space-y-3 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm">
      <div className="flex justify-between items-center pb-2 border-b border-neutral-200 dark:border-neutral-800/50 mb-1">
        <span className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          Borders
        </span>
        <button
          onClick={toggleLink}
          className="text-neutral-400 hover:text-blue-500 transition-colors flex items-center"
        >
          {renderIcon()}
        </button>
      </div>

      <div className="space-y-4">
        {linkMode === "all" ? (
          <div className="space-y-3">
            <SliderInput
              label="Width (All Sides)"
              value={uniformWidth}
              min={0}
              max={20}
              onChange={(v: string) => onChange("borderWidth", v)}
            />
            <div className="flex gap-2">
              <select
                value={uniformStyle}
                onChange={(e) => onChange("borderStyle", e.target.value)}
                className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none"
              >
                <option value="none">None</option>
                <option value="solid">Solid</option>
                <option value="dashed">Dashed</option>
                <option value="dotted">Dotted</option>
              </select>
              <input
                type="color"
                value={
                  uniformColor.match(/#[0-9a-fA-F]{3,8}/)?.[0] || "#cccccc"
                }
                onChange={(e) => onChange("borderColor", e.target.value)}
                className="w-[38px] h-[30px] rounded border border-neutral-200 dark:border-neutral-700 p-0 cursor-pointer shrink-0"
                title="Border Color"
              />
            </div>
          </div>
        ) : (
          ["Top", "Right", "Bottom", "Left"].map((side) => (
            <div
              key={side}
              className="pt-3 border-t border-neutral-200 dark:border-neutral-800/50 first:pt-0 first:border-0 space-y-2.5"
            >
              <span className="font-semibold text-[10px] uppercase text-neutral-500">
                {side}
              </span>
              <SliderInput
                label="Width"
                value={styles[`border${side}Width`] || uniformWidth}
                min={0}
                max={20}
                onChange={(v: string) => onChange(`border${side}Width`, v)}
              />
              <div className="flex gap-2">
                <select
                  value={styles[`border${side}Style`] || uniformStyle}
                  onChange={(e) =>
                    onChange(`border${side}Style`, e.target.value)
                  }
                  className="flex-1 bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-2 py-1.5 text-xs text-neutral-800 dark:text-neutral-200 outline-none"
                >
                  <option value="none">None</option>
                  <option value="solid">Solid</option>
                  <option value="dashed">Dashed</option>
                  <option value="dotted">Dotted</option>
                </select>
                <input
                  type="color"
                  value={
                    (styles[`border${side}Color`] || uniformColor).match(
                      /#[0-9a-fA-F]{3,8}/,
                    )?.[0] || "#cccccc"
                  }
                  onChange={(e) =>
                    onChange(`border${side}Color`, e.target.value)
                  }
                  className="w-[38px] h-[30px] rounded border border-neutral-200 dark:border-neutral-700 p-0 cursor-pointer shrink-0"
                  title={`${side} Border Color`}
                />
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

const GradientColorInput = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) => {
  const isGradient = value?.includes("gradient");
  const [mode, setMode] = useState<"solid" | "gradient">(
    isGradient ? "gradient" : "solid",
  );
  const defaultGrad = "linear-gradient(90deg, #6366f1, #ec4899)";

  const handleModeSwitch = (m: "solid" | "gradient") => {
    setMode(m);
    if (m === "gradient") {
      onChange(isGradient ? value : defaultGrad);
    } else {
      let ext = value?.includes("#")
        ? value.match(/#[0-9a-fA-F]{3,8}/)?.[0]
        : null;
      onChange(ext || "#000000");
    }
  };

  const parseGradient = (v: string) => {
    const degMatch = v.match(/(-?\d+)deg/);
    const angle = degMatch ? parseInt(degMatch[1]) : 90;
    const colors =
      v.match(/(rgba?\(.*?\)|#[0-9a-fA-F]{3,8}|\b[a-zA-Z]+\b)/g) || [];
    const hexs = colors.filter((c) => c.startsWith("#") || c.startsWith("rgb"));
    return { angle, c1: hexs[0] || "#6366f1", c2: hexs[1] || "#ec4899" };
  };

  const grad = parseGradient(value || defaultGrad);

  const updateGradient = (angle: number, c1: string, c2: string) => {
    onChange(`linear-gradient(${angle}deg, ${c1}, ${c2})`);
  };

  return (
    <div className="bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm space-y-4">
      <div className="flex justify-between items-center">
        <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
          {label}
        </label>
        <div className="flex bg-neutral-200/50 dark:bg-neutral-800 rounded-lg p-0.5">
          <button
            onClick={() => handleModeSwitch("solid")}
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${mode === "solid" ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500"}`}
          >
            Solid
          </button>
          <button
            onClick={() => handleModeSwitch("gradient")}
            className={`px-2 py-1 text-[10px] font-bold uppercase rounded-md transition-colors ${mode === "gradient" ? "bg-white dark:bg-neutral-600 shadow-sm text-neutral-900 dark:text-white" : "text-neutral-500"}`}
          >
            Gradient
          </button>
        </div>
      </div>

      {mode === "solid" ? (
        <div className="flex items-center gap-3">
          <input
            type="color"
            value={value.match(/#[0-9a-fA-F]{3,8}/)?.[0] || "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-lg cursor-pointer bg-transparent border-0 outline-none shrink-0 p-0"
          />
          <input
            type="text"
            value={value || ""}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-4 py-3 text-sm text-neutral-800 dark:text-neutral-200 outline-none focus:border-blue-500 shadow-inner font-mono"
            placeholder="#ffffff"
          />
        </div>
      ) : (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex gap-3">
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase">
                Color 1
              </span>
              <div className="flex items-center bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden pr-2 h-9">
                <input
                  type="color"
                  value={grad.c1}
                  onChange={(e) =>
                    updateGradient(grad.angle, e.target.value, grad.c2)
                  }
                  className="w-9 h-9 shrink-0 bg-transparent border-0 outline-none cursor-pointer p-0"
                />
                <span className="text-[10px] font-mono pl-1 text-neutral-600 dark:text-neutral-400 uppercase">
                  {grad.c1}
                </span>
              </div>
            </div>
            <div className="flex flex-col gap-1.5 flex-1">
              <span className="text-[10px] text-neutral-500 font-semibold uppercase">
                Color 2
              </span>
              <div className="flex items-center bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-700 rounded-lg overflow-hidden pr-2 h-9">
                <input
                  type="color"
                  value={grad.c2}
                  onChange={(e) =>
                    updateGradient(grad.angle, grad.c1, e.target.value)
                  }
                  className="w-9 h-9 shrink-0 bg-transparent border-0 outline-none cursor-pointer p-0"
                />
                <span className="text-[10px] font-mono pl-1 text-neutral-600 dark:text-neutral-400 uppercase">
                  {grad.c2}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-[10px] text-neutral-500 font-semibold uppercase">
              <span>Angle</span>
              <span>{grad.angle}°</span>
            </div>
            <input
              type="range"
              min="0"
              max="360"
              value={grad.angle}
              onChange={(e) =>
                updateGradient(parseInt(e.target.value), grad.c1, grad.c2)
              }
              className="w-full h-1.5 bg-neutral-200 dark:bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default function ElementEditorPanel({
  element,
  activeTab,
  onTabChange,
  onClose,
  onUpdateStyle,
  onUpdateContent,
  onUpdateAttribute,
  onSelectElement,
  onResetStyle,
}: {
  element: any;
  activeTab?: "typography" | "colors" | "spacing" | "borders" | "css" | "image";
  onTabChange?: (
    tab: "typography" | "colors" | "spacing" | "borders" | "css" | "image",
  ) => void;
  onClose: () => void;
  onUpdateStyle: (styles: Record<string, string>) => void;
  onUpdateContent: (content: string) => void;
  onUpdateAttribute?: (attributes: Record<string, string>) => void;
  onSelectElement?: (id: string) => void;
  onResetStyle?: (initialStyle: string) => void;
}) {
  const [styles, setStyles] = useState<Record<string, string>>(
    element.computedStyles || {},
  );
  const [content, setContent] = useState<string>(element.innerHTML || "");
  const [plainText, setPlainText] = useState<string>(() => {
    if (typeof window === "undefined") return element.innerHTML || "";
    const temp = document.createElement("div");
    temp.innerHTML = element.innerHTML || "";
    return temp.textContent || "";
  });
  const [_internalTab, _setInternalTab] = useState<
    "typography" | "colors" | "spacing" | "borders" | "css" | "image"
  >("colors");
  const tag = (element.tagName || "").toUpperCase();
  const isTextElement = [
    "H1",
    "H2",
    "H3",
    "H4",
    "H5",
    "H6",
    "P",
    "SPAN",
    "A",
    "BUTTON",
    "LI",
    "LABEL",
    "STRONG",
    "EM",
    "B",
    "I",
  ].includes(tag);
  const isImageNode = tag === "IMG" || tag === "SVG";
  const defaultTab = isTextElement
    ? "typography"
    : isImageNode
      ? "image"
      : "colors";

  useEffect(() => {
    if (!onTabChange && _internalTab !== defaultTab)
      _setInternalTab(defaultTab);
  }, [element.tagName]);

  let currentTab = onTabChange ? (activeTab as any) : _internalTab;
  if (currentTab === "typography" && !isTextElement)
    currentTab = isImageNode ? "image" : "colors";
  if (currentTab === "image" && !isImageNode) currentTab = "colors";
  const setTab = onTabChange || _setInternalTab;

  const [customCss, setCustomCss] = useState(element.inlineStyle || "");
  const [imgSrc, setImgSrc] = useState(element.attributes?.src || "");
  const [imgAlt, setImgAlt] = useState(element.attributes?.alt || "");

  const handleStyleChange = (key: string, value: string) => {
    setStyles({ ...styles, [key]: value });
    onUpdateStyle({ [key]: value });
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    onUpdateContent(e.target.value);
  };

  const handlePlainTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPlainText(e.target.value);
    setContent(e.target.value);
    onUpdateContent(e.target.value);
  };

  const handleCustomCssChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCustomCss(e.target.value);
    const rules = e.target.value.split(";").filter((r) => r.trim());
    const newStyles: Record<string, string> = {};
    rules.forEach((rule) => {
      const [k, v] = rule.split(":");
      if (k && v) newStyles[k.trim()] = v.trim();
    });
    onUpdateStyle(newStyles);
  };

  const doResetStyles = () => {
    if (onResetStyle) {
      onResetStyle(element.inlineStyle || "");
      setStyles(element.computedStyles || {});
      setCustomCss(element.inlineStyle || "");
    }
  };

  const tabsToRender = [
    ...(isTextElement ? [{ id: "typography", icon: Type, title: "Text" }] : []),
    ...(isImageNode ? [{ id: "image", icon: ImageIcon, title: "Image" }] : []),
    { id: "colors", icon: PaintBucket, title: "Color" },
    { id: "spacing", icon: Maximize, title: "Space" },
    { id: "borders", icon: Square, title: "Border" },
    { id: "css", icon: Code, title: "Code" },
  ];

  const [isMobile, setIsMobile] = useState(false);
  const panelRef = React.useRef<HTMLDivElement>(null);
  const isDragging = React.useRef(false);
  const offset = React.useRef({ x: 0, y: 0 });
  const dragStart = React.useRef({ x: 0, y: 0 });

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isMobile) return;
    const target = e.target as HTMLElement;
    if (target.closest("button, input, textarea, select, a, option")) return;
    if (
      target.scrollHeight > target.clientHeight &&
      e.clientX - target.getBoundingClientRect().left > target.clientWidth
    )
      return;

    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - offset.current.x,
      y: e.clientY - offset.current.y,
    };

    if (panelRef.current) panelRef.current.style.transition = "none";
    window.addEventListener("pointermove", handleWindowPointerMove, {
      passive: true,
    });
    window.addEventListener("pointerup", handleWindowPointerUp);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handleWindowPointerMove = (e: PointerEvent) => {
    if (!isDragging.current || !panelRef.current) return;
    offset.current = {
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y,
    };
    panelRef.current.style.transform = `translate(${offset.current.x}px, ${offset.current.y}px)`;
  };

  const handleWindowPointerUp = () => {
    isDragging.current = false;
    if (panelRef.current) panelRef.current.style.transition = "";
    window.removeEventListener("pointermove", handleWindowPointerMove);
    window.removeEventListener("pointerup", handleWindowPointerUp);
  };

  const resizeState = React.useRef<{
    startX: number;
    startY: number;
    startW: number;
    startH: number;
    startTx: number;
    startTy: number;
    dir: string;
  } | null>(null);

  const startResize = (e: React.PointerEvent, dir: string) => {
    e.stopPropagation();
    if (isMobile || !panelRef.current) return;
    const rect = panelRef.current.getBoundingClientRect();
    resizeState.current = {
      startX: e.clientX,
      startY: e.clientY,
      startW: rect.width,
      startH: rect.height,
      startTx: offset.current.x,
      startTy: offset.current.y,
      dir,
    };
    if (panelRef.current) panelRef.current.style.transition = "none";
    window.addEventListener("pointermove", onWindowResizeMove, {
      passive: true,
    });
    window.addEventListener("pointerup", onWindowResizeUp);
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onWindowResizeMove = (e: PointerEvent) => {
    if (!resizeState.current || !panelRef.current) return;
    const { startX, startY, startW, startH, startTx, startTy, dir } =
      resizeState.current;
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    let newW = startW,
      newH = startH,
      newTx = startTx,
      newTy = startTy;

    if (dir.includes("e")) newW = startW + dx;
    if (dir.includes("s")) newH = startH + dy;
    if (dir.includes("w")) {
      newW = startW - dx;
      newTx = startTx + dx;
    }
    if (dir.includes("n")) {
      newH = startH - dy;
      newTy = startTy + dy;
    }

    if (newW < 300) {
      if (dir.includes("w")) newTx -= 300 - newW;
      newW = 300;
    }
    if (newH < 300) {
      if (dir.includes("n")) newTy -= 300 - newH;
      newH = 300;
    }

    panelRef.current.style.width = `${newW}px`;
    panelRef.current.style.height = `${newH}px`;
    offset.current = { x: newTx, y: newTy };
    panelRef.current.style.transform = `translate(${newTx}px, ${newTy}px)`;
  };

  const onWindowResizeUp = () => {
    resizeState.current = null;
    if (panelRef.current) panelRef.current.style.transition = "";
    window.removeEventListener("pointermove", onWindowResizeMove);
    window.removeEventListener("pointerup", onWindowResizeUp);
  };

  return (
    <div
      ref={panelRef}
      onPointerDown={handlePointerDown}
      className={`absolute z-50 bg-white dark:bg-black text-neutral-900 dark:text-neutral-100 flex flex-col shadow-[0_8px_30px_rgb(0,0,0,0.12)] border overflow-visible animate-in slide-in-from-right-8 duration-200 ${
        isMobile
          ? "top-0 right-0 h-full w-full sm:w-80 border-l border-neutral-200 dark:border-neutral-800 rounded-tl-xl overflow-hidden"
          : "top-4 right-4 w-[340px] rounded-xl min-w-[300px] min-h-[300px] border-neutral-200 dark:border-neutral-800 shadow-2xl"
      }`}
      style={
        !isMobile
          ? {
              transform: `translate(${offset.current.x}px, ${offset.current.y}px)`,
            }
          : undefined
      }
    >
      <div className="flex items-center justify-between p-3 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded-t-xl shrink-0">
        <div className="flex items-center gap-2 select-none cursor-grab active:cursor-grabbing hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50 px-2 py-1.5 rounded-md flex-1 transition-colors">
          {!isMobile && <GripHorizontal className="w-4 h-4 text-neutral-400" />}
          <span className="text-[10px] font-mono bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50 px-2 py-0.5 rounded font-semibold uppercase tracking-wider">
            {tag}
          </span>
          <span className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 ml-1">
            Edit Element
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 hover:bg-neutral-200 dark:hover:bg-neutral-800 rounded-md transition-colors ml-2 pointer"
        >
          <X className="w-4 h-4 text-neutral-500" />
        </button>
      </div>

      {element.hierarchy && element.hierarchy.length > 0 && (
        <div className="px-4 py-2 bg-neutral-50 dark:bg-neutral-900/30 border-b border-neutral-200 dark:border-neutral-800 flex flex-wrap items-center gap-1.5 overflow-x-auto scrollbar-none shadow-inner">
          {element.hierarchy.map((n: any, idx: number) => {
            const isLast = idx === element.hierarchy.length - 1;
            return (
              <React.Fragment key={n.id}>
                <button
                  onClick={() => onSelectElement && onSelectElement(n.id)}
                  className={`text-[10px] font-mono px-2 py-1 rounded-md transition-colors ${isLast ? "bg-blue-500 text-white shadow-sm" : "bg-white dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 border border-neutral-200 dark:border-neutral-700 hover:border-neutral-300 dark:hover:border-neutral-600"}`}
                  title="Select this parent"
                >
                  {n.tagName.toLowerCase()}
                </button>
                {!isLast && (
                  <span className="text-neutral-400 dark:text-neutral-600 text-[10px]">
                    ›
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </div>
      )}

      <div className="flex px-2 pt-2 border-b border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/30 gap-1 drop-shadow-sm">
        {tabsToRender.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id as any)}
            className={`flex-1 flex justify-center py-2.5 rounded-t-lg transition-all text-xs font-semibold ${
              currentTab === t.id
                ? "bg-white dark:bg-black text-blue-600 dark:text-blue-400 shadow-[0_-2px_10px_rgba(0,0,0,0.02)]"
                : "text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 hover:bg-neutral-200/50 dark:hover:bg-neutral-800/50"
            }`}
          >
            <div className="flex flex-col items-center gap-1">
              <t.icon className="w-4 h-4" />
              <span className="text-[9px] tracking-wide uppercase">
                {t.title}
              </span>
            </div>
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-auto p-4 space-y-8 scrollbar-thin scrollbar-thumb-neutral-300 dark:scrollbar-thumb-neutral-700 scrollbar-track-transparent pb-6">
        {currentTab === "typography" && isTextElement && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex justify-between">
                <span>Plain Text Content</span>
                {plainText !== content && (
                  <span className="text-orange-500 dark:text-orange-400/80 text-[9px] font-medium">
                    Deletes rich formatting
                  </span>
                )}
              </label>
              <textarea
                value={plainText}
                onChange={handlePlainTextChange}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                rows={4}
              />
            </div>

            <div className="space-y-4">
              <SliderInput
                label="Font Size"
                value={styles.fontSize || "16px"}
                min={8}
                max={120}
                onChange={(v: string) => handleStyleChange("fontSize", v)}
              />
              <SliderInput
                label="Font Weight"
                value={styles.fontWeight || "400"}
                min={100}
                max={900}
                step={100}
                onChange={(v: string) =>
                  handleStyleChange("fontWeight", v.replace("px", ""))
                }
              />
              <SliderInput
                label="Line Height"
                value={styles.lineHeight || "1.5"}
                min={0.5}
                max={3}
                step={0.1}
                defaultUnit=""
                onChange={(v: string) => handleStyleChange("lineHeight", v)}
              />
              <SliderInput
                label="Letter Spacing"
                value={styles.letterSpacing || "0px"}
                min={-5}
                max={20}
                onChange={(v: string) => handleStyleChange("letterSpacing", v)}
              />
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
                  Text Alignment
                </label>
                <div className="flex bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1 gap-1">
                  {["left", "center", "right", "justify"].map((align) => (
                    <button
                      key={align}
                      onClick={() => handleStyleChange("textAlign", align)}
                      className={`flex-1 py-1.5 text-xs capitalize rounded-md transition-all shadow-sm ${styles.textAlign === align ? "bg-white dark:bg-neutral-700 font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-neutral-200 dark:ring-neutral-600" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"}`}
                    >
                      {align}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-2 block">
                  Text Style
                </label>
                <div className="flex flex-col gap-2">
                  <div className="flex bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1 gap-1">
                    {["none", "capitalize", "uppercase", "lowercase"].map(
                      (transform) => (
                        <button
                          key={transform}
                          onClick={() =>
                            handleStyleChange("textTransform", transform)
                          }
                          className={`flex-1 py-1.5 text-xs capitalize rounded-md transition-all shadow-sm ${styles.textTransform === transform || (!styles.textTransform && transform === "none") ? "bg-white dark:bg-neutral-700 font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-neutral-200 dark:ring-neutral-600" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"}`}
                        >
                          {transform === "none" ? "Normal" : transform}
                        </button>
                      ),
                    )}
                  </div>
                  <div className="flex bg-neutral-100 dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-lg p-1 gap-1">
                    {["normal", "italic", "underline", "line-through"].map(
                      (style) => {
                        const isFontStyle = ["normal", "italic"].includes(
                          style,
                        );
                        const styleValue = isFontStyle
                          ? styles.fontStyle
                          : styles.textDecoration;
                        const isActive = isFontStyle
                          ? styleValue === style ||
                            (!styleValue && style === "normal")
                          : styleValue?.includes(style);

                        return (
                          <button
                            key={style}
                            onClick={() => {
                              if (isFontStyle)
                                handleStyleChange("fontStyle", style);
                              else
                                handleStyleChange(
                                  "textDecoration",
                                  isActive ? "none" : style,
                                );
                            }}
                            className={`flex-1 py-1.5 text-xs capitalize rounded-md transition-all shadow-sm ${isActive ? "bg-white dark:bg-neutral-700 font-semibold text-blue-600 dark:text-blue-400 ring-1 ring-neutral-200 dark:ring-neutral-600" : "text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-800"}`}
                          >
                            {style}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {currentTab === "image" && isImageNode && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col space-y-2">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                Image Source URL
              </label>
              <textarea
                value={imgSrc}
                onChange={(e) => {
                  setImgSrc(e.target.value);
                  if (onUpdateAttribute)
                    onUpdateAttribute({ src: e.target.value });
                }}
                className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl p-3 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 transition-all shadow-inner"
                rows={3}
                placeholder="https://images.unsplash.com/..."
              />
            </div>
            {tag === "IMG" && (
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Alt Text
                </label>
                <input
                  type="text"
                  value={imgAlt}
                  onChange={(e) => {
                    setImgAlt(e.target.value);
                    if (onUpdateAttribute)
                      onUpdateAttribute({ alt: e.target.value });
                  }}
                  className="w-full bg-neutral-50 dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-xl px-3 py-2 text-sm text-neutral-800 dark:text-neutral-100 outline-none focus:border-blue-500 shadow-inner"
                  placeholder="Describe the image..."
                />
              </div>
            )}
          </div>
        )}

        {currentTab === "colors" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {isTextElement && (
              <GradientColorInput
                label="Text Color / Gradient"
                value={
                  styles.backgroundImage?.includes("gradient")
                    ? styles.backgroundImage
                    : styles.color || "#ffffff"
                }
                onChange={(v: string) => {
                  if (v.includes("gradient")) {
                    const newStyles = {
                      ...styles,
                      backgroundImage: v,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    };
                    setStyles(newStyles);
                    onUpdateStyle({
                      backgroundImage: v,
                      WebkitBackgroundClip: "text",
                      WebkitTextFillColor: "transparent",
                      color: "transparent",
                    });
                  } else {
                    const newStyles = {
                      ...styles,
                      color: v,
                      backgroundImage: "none",
                      WebkitBackgroundClip: "initial",
                      WebkitTextFillColor: "initial",
                    };
                    setStyles(newStyles);
                    onUpdateStyle({
                      color: v,
                      backgroundImage: "none",
                      WebkitBackgroundClip: "initial",
                      WebkitTextFillColor: "initial",
                    });
                  }
                }}
              />
            )}
            <GradientColorInput
              label={
                isTextElement && !tag.includes("BUTTON")
                  ? "Highlight Background"
                  : "Background / Shape"
              }
              value={
                styles.backgroundImage?.includes("gradient") &&
                styles.WebkitBackgroundClip !== "text"
                  ? styles.backgroundImage
                  : styles.backgroundColor || "transparent"
              }
              onChange={(v: string) => {
                if (v.includes("gradient")) {
                  const newStyles = {
                    ...styles,
                    backgroundImage: v,
                    backgroundColor: "transparent",
                  };
                  setStyles(newStyles);
                  onUpdateStyle({
                    backgroundImage: v,
                    backgroundColor: "transparent",
                  });
                } else {
                  const newStyles = {
                    ...styles,
                    backgroundColor: v,
                    backgroundImage: "none",
                  };
                  setStyles(newStyles);
                  onUpdateStyle({
                    backgroundColor: v,
                    backgroundImage: "none",
                  });
                }
              }}
            />
          </div>
        )}

        {currentTab === "spacing" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            {!isTextElement && (
              <div className="grid grid-cols-2 gap-4 bg-neutral-50 dark:bg-neutral-900/50 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800/80 shadow-sm">
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Width
                  </label>
                  <input
                    type="text"
                    value={styles.width || ""}
                    placeholder="auto, 100%, 50px"
                    onChange={(e) => handleStyleChange("width", e.target.value)}
                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono text-neutral-800 dark:text-neutral-200 outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>
                <div className="flex flex-col space-y-1.5">
                  <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                    Height
                  </label>
                  <input
                    type="text"
                    value={styles.height || ""}
                    placeholder="auto, 100vh, 20px"
                    onChange={(e) =>
                      handleStyleChange("height", e.target.value)
                    }
                    className="w-full bg-white dark:bg-neutral-950 border border-neutral-300 dark:border-neutral-800 rounded-lg px-3 py-2 text-sm font-mono text-neutral-800 dark:text-neutral-200 outline-none focus:border-blue-500 shadow-inner"
                  />
                </div>
              </div>
            )}
            <SpacingControl
              type="margin"
              label="Margin"
              styles={styles}
              onChange={handleStyleChange}
            />
            <SpacingControl
              type="padding"
              label="Padding"
              styles={styles}
              onChange={handleStyleChange}
            />
            <SpacingControl
              type="radius"
              label="Border Radius"
              styles={styles}
              onChange={handleStyleChange}
            />
          </div>
        )}

        {currentTab === "borders" && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <BorderControl styles={styles} onChange={handleStyleChange} />
          </div>
        )}

        {currentTab === "css" && (
          <div className="space-y-6 h-full flex flex-col animate-in fade-in duration-200">
            {!isImageNode && (
              <div className="flex flex-col space-y-2">
                <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300">
                  Raw Element HTML
                </label>
                <textarea
                  value={content}
                  onChange={handleContentChange}
                  className="w-full bg-neutral-100 dark:bg-[#141414] border border-neutral-300 dark:border-neutral-800 rounded-xl p-4 text-xs font-mono text-neutral-800 dark:text-neutral-300 outline-none focus:border-blue-500 shadow-inner scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700"
                  rows={6}
                />
              </div>
            )}

            <div className="flex flex-col space-y-2 flex-1">
              <label className="text-xs font-semibold text-neutral-700 dark:text-neutral-300 flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-neutral-800">
                <Settings2 className="w-3.5 h-3.5" /> Inline CSS Injection
              </label>
              <textarea
                value={customCss}
                onChange={handleCustomCssChange}
                placeholder={"color: red;\nmargin-top: 20px;"}
                className="flex-1 w-full bg-neutral-100 dark:bg-[#141414] border border-neutral-300 dark:border-neutral-800 rounded-xl p-4 text-xs font-mono text-blue-600 dark:text-blue-300 shadow-inner outline-none focus:border-blue-500 scrollbar-thin scrollbar-thumb-neutral-400 dark:scrollbar-thumb-neutral-700"
                rows={6}
              />
              <p className="text-[10px] text-neutral-500 mt-1">
                Use standard CSS syntax separated by semicolons.
              </p>
            </div>
          </div>
        )}
      </div>

      <div className="p-4 border-t border-neutral-200 dark:border-neutral-800 bg-neutral-50 dark:bg-neutral-900/50 rounded-b-xl shrink-0">
        <button
          onClick={doResetStyles}
          className="w-full py-2.5 bg-white dark:bg-[#1a1a1a] hover:bg-neutral-100 dark:hover:bg-[#252525] text-neutral-700 dark:text-neutral-300 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 transition-colors shadow-sm"
        >
          Reset Element Styles
        </button>
      </div>

      {!isMobile && (
        <React.Fragment>
          <div
            className="absolute top-0 left-3 right-3 h-2 cursor-n-resize group z-50 rounded-t-xl"
            onPointerDown={(e) => startResize(e, "n")}
          />
          <div
            className="absolute bottom-0 left-3 right-3 h-2 cursor-s-resize group z-50 rounded-b-xl"
            onPointerDown={(e) => startResize(e, "s")}
          />
          <div
            className="absolute left-0 top-3 bottom-3 w-2 cursor-w-resize group z-50 rounded-l-xl"
            onPointerDown={(e) => startResize(e, "w")}
          />
          <div
            className="absolute right-0 top-3 bottom-3 w-2 cursor-e-resize group z-50 rounded-r-xl"
            onPointerDown={(e) => startResize(e, "e")}
          />

          <div
            className="absolute top-0 left-0 w-4 h-4 cursor-nw-resize z-50"
            onPointerDown={(e) => startResize(e, "nw")}
          />
          <div
            className="absolute top-0 right-0 w-4 h-4 cursor-ne-resize z-50"
            onPointerDown={(e) => startResize(e, "ne")}
          />
          <div
            className="absolute bottom-0 left-0 w-4 h-4 cursor-sw-resize z-50"
            onPointerDown={(e) => startResize(e, "sw")}
          />
          <div
            className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize z-50"
            onPointerDown={(e) => startResize(e, "se")}
          />
        </React.Fragment>
      )}
    </div>
  );
}
