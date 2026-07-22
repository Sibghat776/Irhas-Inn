"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import type { RootState, AppDispatch } from "../Redux/store";
import { loginSuccess, logout } from "../Redux/Features/authSlice";
import { openLogin, openSignup } from "../Redux/Features/modalSlice";
import {
  Menu,
  X,
  LogIn,
  UserPlus,
  ChevronDown,
  ChevronUp,
  User,
  LayoutDashboard,
  LogOut,
  ShoppingCart,
  Package,
  Bell,
  Search,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import useFetch, { baseUrl, showToast } from "../utils/commonFunctions";
import axios from "axios";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Products", href: "/#collection" },
  { name: "Contact", href: "/#contact" },
];

const CATEGORIES = [
  "All",
  "Clothes",
  "Accessories",
  "Pens",
  "Scrubs",
];

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface myResponseData {
  success: boolean;
  data: {
    username: string;
    email: string;
    password?: string | null;
    phoneNo?: number | null;
    googleId?: string | null;
    isAdmin: boolean;
    role?: string;
    isVerified: boolean;
    profilePic: string;
    createdAt?: string;
    updatedAt?: string;
  };
  message: string;
}

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const pathname = usePathname();

  const { username, isVerified, profilePic } = useSelector(
    (state: RootState) => state.auth,
  );

  const authData = useSelector((state: RootState) => state.auth);

  const isHomePage = pathname === "/";

  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [role, setRole] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [ready, setReady] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);

  const [searchQuery, setSearchQuery] = useState("");

  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);

  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const isAdmin = role === "admin" || role === "superadmin";


  const userMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        userMenuRef.current &&
        !userMenuRef.current.contains(event.target as Node)
      ) {
        setUserMenuOpen(false);
      }
    };
    if (userMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [userMenuOpen]);

  const isStandaloneMode = () => {
    if (typeof window === "undefined") return false;

    return (
      window.matchMedia?.("(display-mode: standalone)")?.matches ||
      (navigator as any)?.standalone === true
    );
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  /* ============================================================
     USER ROLE
  ============================================================ */

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem("user");

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);

          const userRole =
            parsedUser?.role ??
            (parsedUser?.isAdmin ? "superadmin" : "user");

          setRole(userRole);
        } catch {
          setRole("user");
        }
      } else {
        setRole("user");
      }

      setReady(true);
    }
  }, []);

  /* ============================================================
     LOCAL CART
  ============================================================ */

  useEffect(() => {
    if (authData.username) return;

    const updateCartCount = () => {
      try {
        const cart = JSON.parse(
          localStorage.getItem("zeef_store_cart") ?? "[]",
        );

        const total = cart.reduce(
          (sum: number, item: any) => sum + (item.quantity || 1),
          0,
        );

        setCartCount(total);
      } catch {
        setCartCount(0);
      }
    };

    updateCartCount();

    window.addEventListener("storage", updateCartCount);

    const interval = setInterval(updateCartCount, 1000);

    return () => {
      window.removeEventListener("storage", updateCartCount);
      clearInterval(interval);
    };
  }, [authData.username]);

  /* ============================================================
     BACKEND CART
  ============================================================ */

  useEffect(() => {
    if (!authData.username) return;

    const fetchBackendCart = async () => {
      try {
        const res = await axios.get(`${baseUrl}cart/`, {
          withCredentials: true,
        });

        const items = res.data.data || [];

        const total = items.reduce(
          (sum: number, item: any) => sum + (item.quantity || 1),
          0,
        );

        setCartCount(total);
      } catch {
        /* ignore */
      }
    };

    fetchBackendCart();

    const handleCartUpdate = () => fetchBackendCart();

    window.addEventListener("cart-updated", handleCartUpdate);

    return () =>
      window.removeEventListener("cart-updated", handleCartUpdate);
  }, [authData.username]);

  /* ============================================================
     PWA INSTALL
  ============================================================ */

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    setIsAppInstalled(isStandaloneMode());

    window.addEventListener(
      "beforeinstallprompt",
      handleBeforeInstallPrompt,
    );

    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );

      window.removeEventListener(
        "appinstalled",
        handleAppInstalled,
      );
    };
  }, []);

  /* ============================================================
     BODY SCROLL LOCK
  ============================================================ */

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";

    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  /* ============================================================
     USER DATA
  ============================================================ */

  const { data: userData } = useFetch<myResponseData>(
    authData.username
      ? `${baseUrl}auth/getUser/${authData.username}`
      : "",
  );

  useEffect(() => {
    if (userData?.data) {
      setRole(
        userData.data.role ??
        (userData.data.isAdmin ? "superadmin" : "user"),
      );

      const stored = localStorage.getItem("user");

      if (stored) {
        try {
          const parsed = JSON.parse(stored);

          const freshRole =
            userData.data.role ??
            (userData.data.isAdmin ? "superadmin" : "user");

          if (parsed.role !== freshRole) {
            localStorage.setItem(
              "user",
              JSON.stringify({
                ...parsed,
                role: freshRole,
              }),
            );
          }
        } catch { }
      }
    }
  }, [userData]);

  /* ============================================================
     SCROLL
  ============================================================ */

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 40);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);

    return () =>
      window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  /* ============================================================
     SEARCH
  ============================================================ */

  const handleSearch = (event?: React.FormEvent) => {
    event?.preventDefault();

    const query = searchQuery.trim();

    if (!query) return;

    setMenuOpen(false);

    router.push(
      `/productsPage?search=${encodeURIComponent(query)}`,
    );
  };

  const handleCategoryClick = (category: string) => {
    if (category === "All") {
      router.push("/productsPage");
      setMenuOpen(false);
      return;
    }

    router.push(
      `/productsPage?search=${encodeURIComponent(category)}`,
    );

    setMenuOpen(false);
  };

  /* ============================================================
     NAVBAR STYLE
  ============================================================ */

  const navbarClasses = clsx(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
    !isHomePage
      ? "bg-[#222831] text-white shadow-md border-b border-[#222831]"
      : isScrolled
        ? "bg-white/95 backdrop-blur-md shadow-md border-b border-[#EEEEEE]"
        : "bg-transparent",
  );
  /* ============================================================
     LOGOUT
  ============================================================ */

  const handleLogout = async () => {
    dispatch(logout());

    await axios.get(`${baseUrl}auth/logout`);

    setUserMenuOpen(false);
    setMenuOpen(false);

    window.location.reload();

    setTimeout(() => {
      window.location.href = "/";
    }, 1000);
  };

  /* ============================================================
     INSTALL APP
  ============================================================ */

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();

    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  /* ============================================================
     LOGIN STATE
  ============================================================ */

  useEffect(() => {
    const user = localStorage.getItem("user");

    if (user) {
      dispatch(loginSuccess(JSON.parse(user)));
    }
  }, [dispatch]);

  /* ============================================================
     NOTIFICATIONS
  ============================================================ */

  const fetchUnreadCount = useCallback(async () => {
    if (!authData.username) return;

    try {
      const res = await axios.get(
        `${baseUrl}notifications/`,
        {
          withCredentials: true,
        },
      );

      const all = res.data.data || [];

      const unread = all.filter(
        (n: any) => !n.isRead,
      ).length;

      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  }, [authData.username]);

  useEffect(() => {
    if (authData.username) {
      fetchUnreadCount();

      const interval = setInterval(
        fetchUnreadCount,
        30000,
      );

      const handleRead = () => {
        setUnreadCount(0);
      };

      window.addEventListener(
        "notifications-read",
        handleRead,
      );

      return () => {
        clearInterval(interval);

        window.removeEventListener(
          "notifications-read",
          handleRead,
        );
      };
    }
  }, [
    authData.username,
    fetchUnreadCount,
  ]);

  /* ============================================================
     USER MENU
  ============================================================ */

  const handleUserMenuToggle = () => {
    setUserMenuOpen((prev) => !prev);
  };

  /* ============================================================
     ADMIN
  ============================================================ */

  const handleAdminPage = () => {
    try {
      setUserMenuOpen(false);

      if (isAdmin) {
        window.location.href = "/Admin/Overview";
      } else {
        showToast(
          "Unauthorized: Admin access only",
          "error",
        );
      }
    } catch (error) {
      console.log(error);

      showToast(
        "Failed to access admin panel",
        "error",
      );
    }
  };

  const handleMobileAdminPage = () => {
    try {
      setMenuOpen(false);

      if (isAdmin) {
        window.location.href = "/Admin/Overview";
      } else {
        showToast(
          "Unauthorized: Admin access only",
          "error",
        );
      }
    } catch (error) {
      console.log(error);

      showToast(
        "Failed to access admin panel",
        "error",
      );
    }
  };

  return (
    <nav className={navbarClasses}>
      {/* ========================================================
          MAIN NAVBAR
      ======================================================== */}

      <div className="mx-auto max-w-7xl px-3 sm:px-6">
        <div className="flex min-h-[64px] items-center justify-between gap-2 sm:min-h-[68px] sm:gap-4">

          {/* ====================================================
              BRAND
          ==================================================== */}

          <Link
            href="/"
            className="flex min-w-0 shrink-0 items-center gap-2 transition-transform active:scale-95"
          >
            <img
              src="/Logo.png"
              alt="ZeeF Trendy Store"
              className="h-9 w-9 shrink-0 rounded-full border border-black/10 object-cover sm:h-10 sm:w-10"
            />

            {/* Store name is now visible on mobile */}
            <span
              className={clsx(
                "max-w-[145px] truncate text-sm font-bold tracking-tight transition-colors sm:max-w-none sm:text-base md:text-lg",
                !isHomePage
                  ? "text-white"
                  : isScrolled
                    ? "text-[#222831]"
                    : "text-white"
              )}
            >
              ZeeF Trendy Store
            </span>
          </Link>

          {/* ====================================================
              DESKTOP NAV
          ==================================================== */}

          <div className="hidden items-center gap-5 lg:flex">
            {NAV_LINKS.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className={clsx(
                  "relative border-b-2 border-transparent pb-1 text-sm font-semibold transition-all",
                  !isHomePage
                    ? "text-white"
                    : isScrolled
                      ? "text-[#222831] hover:border-[#00ADB5] hover:text-[#00ADB5]"
                      : "text-white hover:border-black"
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          {/* ====================================================
              SEARCH
          ==================================================== */}

          <form
            onSubmit={handleSearch}
            className="hidden min-w-0 max-w-[320px] flex-1 md:flex"
          >
            <div
              className={clsx(
                "flex w-full items-center rounded-full border px-3 transition-all",
                !isHomePage
                  ? "bg-white text-white"
                  : isScrolled
                    ? "text-[#222831] hover:border-[#00ADB5] hover:text-[#00ADB5]"
                    : "text-white hover:border-black"
              )}
            >
              <Search
                size={17}
                className={clsx(
                  "shrink-0",
                  isScrolled || !isHomePage
                    ? "text-[#222831]/50"
                    : "text-white/70",
                )}
              />

              <input
                type="search"
                value={searchQuery}
                onChange={(e) =>
                  setSearchQuery(e.target.value)
                }
                placeholder="Search products..."
                className={clsx(
                  "w-full bg-transparent px-2.5 py-2 text-sm outline-none placeholder:text-xs",
                  isScrolled || !isHomePage
                    ? "text-[#222831] placeholder:text-[#222831]/40"
                    : "text-white placeholder:text-white/60",
                )}
              />

              <button
                type="submit"
                className="rounded-full bg-[#00ADB5] px-3 py-1.5 text-xs font-bold text-white transition hover:bg-[#0099A1]"
              >
                Search
              </button>
            </div>
          </form>

          {/* ====================================================
              RIGHT ACTIONS
          ==================================================== */}

          <div className="hidden items-center gap-2 md:flex">

            {/* CART */}

            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className={clsx(
                "relative flex h-10 w-10 items-center justify-center rounded-full transition-all",
                !isHomePage
                  ? "text-white"
                  : isScrolled
                    ? "text-[#222831]"
                    : "text-white"
              )}
            >
              <ShoppingCart size={20} />

              {cartCount > 0 && (
                <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-[#00ADB5] px-1 text-[10px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            {/* INSTALL APP */}

            {deferredPrompt && !isAppInstalled && (
              <button
                onClick={handleInstallClick}
                className="rounded-lg bg-[#00ADB5] px-3 py-2 text-xs font-bold text-white transition hover:bg-[#0099A1]"
              >
                Download App
              </button>
            )}

            {/* AUTH */}

            {isMounted && isVerified ? (
              <div
                ref={userMenuRef}
                className="relative"
              >
                <button
                  onClick={handleUserMenuToggle}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-all",
                    !isHomePage
                      ? "border-white/20 bg-white/10 text-white hover:bg-white/20"
                      : isScrolled
                        ? "border-[#EEEEEE] bg-white text-[#222831] hover:bg-[#EEEEEE]"
                        : "border-white/30 bg-white/10 text-white hover:bg-white/20",
                  )}
                >
                  {profilePic ? (
                    <img
                      src={profilePic}
                      className="h-7 w-7 rounded-full object-cover"
                      alt="profile"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#00ADB5] text-xs font-bold text-white">
                      {username?.charAt(0).toUpperCase()}
                    </div>
                  )}

                  <span className="max-w-[100px] truncate text-sm font-semibold capitalize">
                    {username}
                  </span>

                  <div className="relative">
                    <Bell size={14} />

                    {unreadCount > 0 && (
                      <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-white bg-[#00ADB5]" />
                    )}
                  </div>

                  {userMenuOpen ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-[#EEEEEE] bg-white text-[#222831] shadow-xl">
                    <div className="border-b border-[#EEEEEE] p-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#EEEEEE] hover:text-[#00ADB5]"
                      >
                        <User size={16} />
                        Profile
                      </Link>

                      <Link
                        href="/profile/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#EEEEEE] hover:text-[#00ADB5]"
                      >
                        <Package size={16} />
                        Orders
                      </Link>

                      <Link
                        href="/profile/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#EEEEEE] hover:text-[#00ADB5]"
                      >
                        <Bell size={16} />
                        Notifications

                        {unreadCount > 0 && (
                          <span className="ml-auto h-2 w-2 rounded-full bg-[#00ADB5]" />
                        )}
                      </Link>

                      <Link
                        href="/cart"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#EEEEEE] hover:text-[#00ADB5]"
                      >
                        <ShoppingCart size={16} />
                        Cart

                        {cartCount > 0 && (
                          <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#00ADB5] px-1 text-[10px] font-bold text-white">
                            {cartCount}
                          </span>
                        )}
                      </Link>

                      {isAdmin && (
                        <button
                          onClick={handleAdminPage}
                          className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#EEEEEE] hover:text-[#00ADB5]"
                        >
                          <LayoutDashboard size={16} />
                          Admin
                        </button>
                      )}
                    </div>

                    <div className="p-1">
                      <button
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold hover:bg-[#EEEEEE] hover:text-red-500"
                      >
                        <LogOut size={16} />
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <button
                  onClick={() => dispatch(openLogin())}
                  className="flex items-center gap-2 rounded-lg bg-[#00ADB5] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#0099A1]"
                >
                  <LogIn size={16} />
                  Login
                </button>

                <button
                  onClick={() => dispatch(openSignup())}
                  className={clsx(
                    "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-all duration-300",
                    isScrolled || !isHomePage
                      ? "bg-[#222831] text-white shadow-lg hover:bg-[#00ADB5] hover:shadow-xl"
                      : "border border-white/40 bg-white/10 text-white backdrop-blur-md hover:bg-white/20",
                  )}
                >
                  <UserPlus size={16} />
                  Sign Up
                </button>
              </>
            )}
          </div>

          {/* ====================================================
              MOBILE CART + MENU
          ==================================================== */}

          <div className="flex shrink-0 items-center gap-1 md:hidden">

            <Link
              href="/cart"
              aria-label="Shopping Cart"
              className={clsx(
                "relative flex h-10 w-10 items-center justify-center rounded-full",
                isScrolled || !isHomePage
                  ? "text-[#222831]"
                  : "text-white",
              )}
            >
              <ShoppingCart size={21} />

              {cartCount > 0 && (
                <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#00ADB5] px-1 text-[9px] font-bold text-white">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setMenuOpen(true)}
              aria-label="Open Navigation Menu"
              className={clsx(
                "flex h-10 w-10 items-center justify-center rounded-lg",
                isScrolled || !isHomePage
                  ? "text-[#222831] hover:bg-[#EEEEEE]"
                  : "text-white hover:bg-white/10",
              )}
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================
          MOBILE DRAWER
      ======================================================== */}

      {menuOpen && (
        <div className="fixed inset-0 z-[100] bg-black/30 md:hidden">
          <div
            className="absolute inset-0"
            onClick={() => setMenuOpen(false)}
          />

          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col overflow-y-auto bg-white shadow-2xl">

            {/* DRAWER HEADER */}

            <div className="flex items-center justify-between border-b border-[#EEEEEE] p-5">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex min-w-0 items-center gap-3"
              >
                <img
                  src="/Logo.png"
                  alt="Logo"
                  className="h-9 w-9 shrink-0 rounded-full object-cover"
                />

                <span className="truncate font-bold text-[#222831]">
                  ZeeF Trendy Store
                </span>
              </Link>

              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#EEEEEE] text-[#222831]"
              >
                <X size={20} />
              </button>
            </div>

            {/* MOBILE SEARCH */}

            <div className="border-b border-[#EEEEEE] p-5">
              <form onSubmit={handleSearch}>
                <div className="flex items-center rounded-xl border border-[#EEEEEE] bg-[#EEEEEE]/50 p-1.5 focus-within:border-[#00ADB5] focus-within:bg-white">
                  <Search
                    size={18}
                    className="ml-2 text-[#222831]/50"
                  />

                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) =>
                      setSearchQuery(e.target.value)
                    }
                    placeholder="Search products..."
                    className="min-w-0 flex-1 bg-transparent px-3 py-2 text-sm text-[#222831] outline-none"
                  />

                  <button
                    type="submit"
                    className="rounded-lg bg-[#00ADB5] px-3 py-2 text-xs font-bold text-white"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            {/* MOBILE CATEGORIES */}

            <div className="border-b border-[#EEEEEE] p-5">
              <p className="mb-3 text-xs font-bold uppercase tracking-wider text-[#222831]/50">
                Categories
              </p>

              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((category) => (
                  <button
                    key={category}
                    onClick={() =>
                      handleCategoryClick(category)
                    }
                    className="rounded-full border border-[#EEEEEE] bg-[#EEEEEE]/50 px-4 py-2 text-xs font-semibold text-[#222831] transition hover:border-[#00ADB5] hover:text-[#00ADB5]"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            {/* MOBILE NAV LINKS */}

            <div className="p-5">
              <div className="space-y-1">
                {NAV_LINKS.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center rounded-xl px-4 py-3 text-sm font-semibold text-[#222831] transition hover:bg-[#EEEEEE] hover:text-[#00ADB5]"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* MOBILE AUTH */}

            <div className="mt-auto border-t border-[#EEEEEE] p-5">
              {isMounted && isVerified ? (
                <div className="space-y-4">

                  <div className="flex items-center gap-3 rounded-xl bg-[#EEEEEE]/60 p-3">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        className="h-10 w-10 rounded-full object-cover"
                        alt="profile"
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#00ADB5] font-bold text-white">
                        {username
                          ?.charAt(0)
                          .toUpperCase()}
                      </div>
                    )}

                    <div>
                      <p className="text-sm font-bold capitalize text-[#222831]">
                        {username}
                      </p>

                      <p className="text-xs font-semibold text-[#00ADB5]">
                        Verified
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">

                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EEEEEE] py-3 text-xs font-semibold text-[#222831]"
                    >
                      <User size={15} />
                      Profile
                    </Link>

                    <Link
                      href="/profile/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EEEEEE] py-3 text-xs font-semibold text-[#222831]"
                    >
                      <Package size={15} />
                      Orders
                    </Link>

                    <Link
                      href="/profile/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EEEEEE] py-3 text-xs font-semibold text-[#222831]"
                    >
                      <Bell size={15} />
                      Notifications

                      {unreadCount > 0 && (
                        <span className="h-2 w-2 rounded-full bg-[#00ADB5]" />
                      )}
                    </Link>

                    <Link
                      href="/cart"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-lg bg-[#EEEEEE] py-3 text-xs font-semibold text-[#222831]"
                    >
                      <ShoppingCart size={15} />
                      Cart

                      {cartCount > 0 && (
                        <span className="rounded-full bg-[#00ADB5] px-1.5 py-0.5 text-[9px] font-bold text-white">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </div>

                  {deferredPrompt && !isAppInstalled && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full rounded-lg bg-[#00ADB5] py-3 text-sm font-bold text-white"
                    >
                      Download App
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">

                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href =
                          "/editProfile";
                      }}
                      className="rounded-lg border border-[#EEEEEE] py-3 text-xs font-semibold text-[#222831]"
                    >
                      Edit Profile
                    </button>

                    {isAdmin ? (
                      <button
                        onClick={handleMobileAdminPage}
                        className="rounded-lg bg-[#222831] py-3 text-xs font-semibold text-white"
                      >
                        Admin Panel
                      </button>
                    ) : (
                      <button
                        onClick={handleLogout}
                        className="rounded-lg bg-[#222831] py-3 text-xs font-semibold text-white"
                      >
                        Logout
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-lg border border-[#EEEEEE] py-3 text-xs font-semibold text-[#222831]"
                    >
                      Logout
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(openLogin());
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg bg-[#00ADB5] py-3 text-sm font-semibold text-white"
                  >
                    <LogIn size={16} />
                    Login
                  </button>

                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(openSignup());
                    }}
                    className="flex items-center justify-center gap-2 rounded-lg border border-[#EEEEEE] py-3 text-sm font-semibold text-[#222831]"
                  >
                    <UserPlus size={16} />
                    Sign Up
                  </button>

                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;