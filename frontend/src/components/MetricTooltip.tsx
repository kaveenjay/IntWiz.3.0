import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";

interface MetricTooltipProps {
  title: string;
  description: string;
  details?: string;
  methodologyAnchor?: string;
}

function MetricTooltip({ title, description, details, methodologyAnchor }: MetricTooltipProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isClickOpened, setIsClickOpened] = useState(false);
  const tooltipRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (tooltipRef.current && !tooltipRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setIsClickOpened(false);
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
        setIsClickOpened(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const handleClick = () => {
    if (isClickOpened) {
      setIsOpen(false);
      setIsClickOpened(false);
    } else {
      setIsOpen(true);
      setIsClickOpened(true);
    }
  };

  const handleMouseEnter = () => {
    if (!isClickOpened) {
      setIsOpen(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isClickOpened) {
      setIsOpen(false);
    }
  };

  return (
    <span className="relative inline-flex items-center" ref={tooltipRef}>
      <button
        type="button"
        onClick={handleClick}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        aria-label={`Info about ${title}`}
        className="ml-1.5 inline-flex items-center justify-center w-4 h-4 rounded-full border border-line-strong text-ink-soft text-[10px] font-mono hover:bg-soft hover:border-accent hover:text-accent transition-colors cursor-help"
      >
        ?
      </button>

      {isOpen && (
        <>
          {/* Mobile: fixed bottom sheet */}
          <div className="sm:hidden fixed inset-x-4 bottom-4 z-50 bg-frame border border-line-strong shadow-2xl p-5">
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
              — Metric explanation
            </div>
            <h4 className="font-display text-lg mb-2">
              {title}
            </h4>
            <p className="text-sm text-ink leading-relaxed mb-3">
              {description}
            </p>
            {details && (
              <p className="text-xs text-ink-soft leading-relaxed mb-3">
                {details}
              </p>
            )}
            <div className="flex justify-between items-center mt-2">
              {methodologyAnchor ? (
                <Link
                  to={`/methodology#${methodologyAnchor}`}
                  className="text-xs font-mono uppercase tracking-widest text-accent hover:underline"
                  onClick={() => {
                    setIsOpen(false);
                    setIsClickOpened(false);
                  }}
                >
                  Read methodology →
                </Link>
              ) : <span />}
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setIsClickOpened(false);
                }}
                className="text-xs font-mono uppercase tracking-widest text-ink-soft"
              >
                Close
              </button>
            </div>
          </div>

          {/* Desktop: positioned tooltip */}
          <div
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
            className="hidden sm:block absolute z-50 w-80 bg-frame border border-line-strong shadow-lg p-5 left-0 top-6"
          >
            <div className="font-mono text-[10px] uppercase tracking-widest text-ink-soft mb-2">
              — Metric explanation
            </div>
            <h4 className="font-display text-lg mb-2">
              {title}
            </h4>
            <p className="text-sm text-ink leading-relaxed mb-3">
              {description}
            </p>
            {details && (
              <p className="text-xs text-ink-soft leading-relaxed mb-3">
                {details}
              </p>
            )}
            {methodologyAnchor && (
              <Link
                to={`/methodology#${methodologyAnchor}`}
                className="text-xs font-mono uppercase tracking-widest text-accent hover:underline"
              >
                Read methodology →
              </Link>
            )}
          </div>
        </>
      )}
    </span>
  );
}

export default MetricTooltip;