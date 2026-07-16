"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../Redux/store";
import nprogress from "nprogress";
import "nprogress/nprogress.css";

nprogress.configure({ showSpinner: false, minimum: 0.15, speed: 400, trickleSpeed: 200 });

const RouteProgressBar = () => {
  const pathname = usePathname();
  const loading = useSelector((state: RootState) => state.ui.loading);
  const [active, setActive] = useState(false);
  const prevPath = useRef(pathname);

  // Start the bar whenever the route changes or the global loading flag is on.
  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      nprogress.start();
      setActive(true);
    }
    if (loading) {
      nprogress.start();
      setActive(true);
    }
  }, [pathname, loading]);

  // Once the page is settled (pathname stable and not loading), finish it.
  useEffect(() => {
    if (active && !loading) {
      const t = setTimeout(() => {
        nprogress.done();
        setActive(false);
      }, 300);
      return () => clearTimeout(t);
    }
  }, [active, loading, pathname]);

  return null;
};

export default RouteProgressBar;
