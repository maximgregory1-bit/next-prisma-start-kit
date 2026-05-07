"use client";

import * as React from "react";
import { usePathname, useSearchParams } from "next/navigation";

const START_DELAY_MS = 80;
const FINISH_DELAY_MS = 220;
const STEP_INTERVAL_MS = 160;

export function RouteLoader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [loading, setLoading] = React.useState(true);
  const [progress, setProgress] = React.useState(0);

  React.useEffect(() => {
    let startTimer: ReturnType<typeof setTimeout> | null = null;
    let finishTimer: ReturnType<typeof setTimeout> | null = null;
    let stepTimer: ReturnType<typeof setInterval> | null = null;

    const start = () => {
      setLoading(true);
      setProgress(20);

      stepTimer = setInterval(() => {
        setProgress((value) => (value < 90 ? value + 10 : value));
      }, STEP_INTERVAL_MS);

      finishTimer = setTimeout(() => {
        setProgress(100);
        setTimeout(() => {
          setLoading(false);
          setProgress(0);
        }, FINISH_DELAY_MS);
      }, 520);
    };

    startTimer = setTimeout(start, START_DELAY_MS);

    return () => {
      if (startTimer) clearTimeout(startTimer);
      if (finishTimer) clearTimeout(finishTimer);
      if (stepTimer) clearInterval(stepTimer);
    };
  }, [pathname, searchParams?.toString()]);

  return (
    <div
      className={
        loading
          ? "route-loader route-loader--active"
          : "route-loader"
      }
      style={{ transform: `scaleX(${progress / 100})` }}
      aria-hidden="true"
    />
  );
}
