"use client";

import {
  type CSSProperties,
  type ReactNode,
  type RefObject,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

type DropdownTriggerProps = {
  readonly close: () => void;
  readonly open: boolean;
  readonly toggle: () => void;
  readonly triggerRef: RefObject<HTMLElement | null>;
};

type DropdownProps = {
  readonly children: ReactNode;
  readonly onOpenChange: (open: boolean) => void;
  readonly open: boolean;
  readonly panelClassName?: string;
  readonly trigger: (props: DropdownTriggerProps) => ReactNode;
  readonly width?: number | "trigger";
};

const viewportMargin = 16;
const offset = 4;

export function Dropdown({
  children,
  onOpenChange,
  open,
  panelClassName = "",
  trigger,
  width,
}: DropdownProps) {
  const [mounted, setMounted] = useState(false);
  const [floatingStyle, setFloatingStyle] = useState<CSSProperties>({
    left: 0,
    maxHeight: "calc(100vh - 2rem)",
    top: 0,
  });
  const triggerRef = useRef<HTMLElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    function closeWhenOutside(event: MouseEvent) {
      const target = event.target as Node;

      if (
        triggerRef.current &&
        !triggerRef.current.contains(target) &&
        panelRef.current &&
        !panelRef.current.contains(target)
      ) {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", closeWhenOutside);
    return () => document.removeEventListener("mousedown", closeWhenOutside);
  }, [onOpenChange]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }

    function updatePosition() {
      const triggerElement = triggerRef.current;
      const panelElement = panelRef.current;

      if (!triggerElement) {
        return;
      }

      const triggerRect = triggerElement.getBoundingClientRect();
      const targetWidth =
        width === "trigger"
          ? triggerRect.width
          : width ?? panelElement?.offsetWidth ?? triggerRect.width;
      const safeWidth = Math.min(
        targetWidth,
        window.innerWidth - viewportMargin * 2,
      );
      const panelHeight = panelElement?.offsetHeight ?? 0;
      const spaceBelow = window.innerHeight - triggerRect.bottom - offset;
      const spaceAbove = triggerRect.top - offset;
      const openUp = panelHeight > spaceBelow && spaceAbove > spaceBelow;
      const availableHeight = Math.max(
        viewportMargin,
        (openUp ? spaceAbove : spaceBelow) - viewportMargin,
      );
      const left = Math.min(
        Math.max(viewportMargin, triggerRect.left),
        Math.max(viewportMargin, window.innerWidth - safeWidth - viewportMargin),
      );
      const top = openUp
        ? Math.max(viewportMargin, triggerRect.top - panelHeight - offset)
        : Math.min(
            triggerRect.bottom + offset,
            window.innerHeight - viewportMargin,
          );

      setFloatingStyle({
        left,
        maxHeight: availableHeight,
        top,
        width: safeWidth,
      });
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    const observer =
      typeof ResizeObserver === "undefined"
        ? null
        : new ResizeObserver(updatePosition);

    if (panelRef.current && observer) {
      observer.observe(panelRef.current);
    }

    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      observer?.disconnect();
    };
  }, [open, width]);

  function close() {
    onOpenChange(false);
  }

  function toggle() {
    onOpenChange(!open);
  }

  return (
    <>
      {trigger({ close, open, toggle, triggerRef })}
      {mounted && open
        ? createPortal(
            <div
              className={`fixed z-[100] overflow-auto ${panelClassName}`}
              ref={panelRef}
              style={floatingStyle}
            >
              {children}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
