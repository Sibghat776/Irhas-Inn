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
  Search,
  Phone,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import clsx from "clsx";
import useFetch, { baseUrl, showToast } from "../utils/commonFunctions";
import axios from "axios";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "Products", href: "/productsPage" },
  { name: "About", href: "/#about", isHash: true },
  { name: "Contact Us", href: "/#contact", isHash: true },
];

const CATEGORIES = ["All", "Clothes", "Accessories", "Pens", "Scrubs"];

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
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
  const [cartCount, setCartCount] = useState(0);
  const [cartBounce, setCartBounce] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);
  const [isiOS, setIsiOS] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  const isAdmin = role === "admin" || role === "superadmin";
  const userMenuRef = useRef<HTMLDivElement>(null);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const prevCartCount = useRef(cartCount);

  // Bounce cart icon when count changes
  useEffect(() => {
    if (cartCount > prevCartCount.current) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 400);
      prevCartCount.current = cartCount;
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

  // Click outside handlers
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
      if (categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target as Node)) {
        setCategoryDropdownOpen(false);
      }
    };
    if (userMenuOpen || categoryDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuOpen, categoryDropdownOpen]);

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

  // Load user role from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUser = window.localStorage.getItem("user");
      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setRole(parsedUser?.role ?? (parsedUser?.isAdmin ? "superadmin" : "user"));
        } catch {
          setRole("user");
        }
      } else {
        setRole("user");
      }
    }
  }, []);

  // Local cart count
  useEffect(() => {
    if (authData.username) return;
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("irhasinn_cart") ?? "[]");
        setCartCount(cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
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

  // Backend cart count
  useEffect(() => {
    if (!authData.username) return;
    const fetchBackendCart = async () => {
      try {
        const res = await axios.get(`${baseUrl}cart/`, { withCredentials: true });
        const items = res.data.data || [];
        setCartCount(items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0));
      } catch {
        /* silent */
      }
    };
    fetchBackendCart();
    const handleCartUpdate = () => fetchBackendCart();
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [authData.username]);

  // PWA install — with localStorage persistence & iOS detection
  useEffect(() => {
    // Detect iOS Safari
    const iOS =
      (/iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream) ||
      (navigator.maxTouchPoints > 0 && navigator.platform === 'MacIntel'); // iPadOS 13+
    setIsiOS(iOS);

    // Check localStorage for already installed
    let installed = false;
    try {
      installed = localStorage.getItem("irhasinn_app_installed") === "true";
    } catch {}

    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };
    const handleAppInstalled = () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
      // Persist to localStorage
      try {
        localStorage.setItem("irhasinn_app_installed", "true");
      } catch {}
    };

    // Check standalone mode OR localStorage flag
    const standalone = isStandaloneMode();
    setIsAppInstalled(standalone || installed);

    if (!standalone && !installed) {
      window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    }
    window.addEventListener("appinstalled", handleAppInstalled);
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  // Body scroll lock when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

  // Fetch fresh user data for role sync
  const { data: userData } = useFetch<myResponseData>(
    authData.username ? `${baseUrl}auth/getUser/${authData.username}` : "",
  );

  useEffect(() => {
    if (userData?.data) {
      const freshRole = userData.data.role ?? (userData.data.isAdmin ? "superadmin" : "user");
      setRole(freshRole);
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed.role !== freshRole) {
            localStorage.setItem("user", JSON.stringify({ ...parsed, role: freshRole }));
          }
        } catch {
          /* silent */
        }
      }
    }
  }, [userData]);

  // Scroll handler for background change
  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 40);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  // Search handler
  const handleSearch = (event?: React.FormEvent) => {
    event?.preventDefault();
    const query = searchQuery.trim();
    if (!query) return;
    setMenuOpen(false);
    let params = `search=${encodeURIComponent(query)}`;
    if (selectedCategory !== "All") {
      params += `&category=${encodeURIComponent(selectedCategory)}`;
    }
    router.push(`/productsPage?${params}`);
  };

  const handleCategoryClick = (category: string) => {
    setMenuOpen(false);
    if (category === "All") {
      router.push("/productsPage");
      return;
    }
    router.push(`/productsPage?search=${encodeURIComponent(category)}`);
  };

  // Navbar background style — always has a dark background on the homepage too
  const navbarClasses = clsx(
    "transition-all duration-500 ease-out",
    !isHomePage
      ? "bg-[#222831] text-white shadow-md"
      : isScrolled
        ? "bg-white/90 backdrop-blur-xl shadow-[0_1px_30px_-10px_rgba(0,0,0,0.12)] border-b border-white/20"
        : "bg-[#222831] text-white shadow-sm",
  );

  // Logout
  const handleLogout = async () => {
    dispatch(logout());
    try {
      await axios.get(`${baseUrl}auth/logout`);
    } catch {
      /* silent */
    }
    setUserMenuOpen(false);
    setMenuOpen(false);
    window.location.href = "/";
  };

  // PWA install click
  const handleInstallClick = async () => {
    // iOS fallback — show instructions instead of native prompt
    if (isiOS) {
      setShowIOSInstructions(true);
      return;
    }
    if (!deferredPrompt) return;
    try {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        try {
          localStorage.setItem("irhasinn_app_installed", "true");
        } catch {}
      }
    } catch {
      /* user cancelled */
    }
  };

  // Restore login state from localStorage
  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      try {
        dispatch(loginSuccess(JSON.parse(user)));
      } catch {
        /* silent */
      }
    }
  }, [dispatch]);

  const handleUserMenuToggle = () => setUserMenuOpen((prev) => !prev);

  const handleAdminPage = () => {
    setUserMenuOpen(false);
    if (isAdmin) {
      window.location.href = "/Admin/Overview";
    } else {
      showToast("Unauthorized: Admin access only", "error");
    }
  };

  return (
    <div className="sticky top-0 z-50 font-['Geist',sans-serif]">
      {/* ──────── TOP CONTACT STRIP ──────── */}
      <div className="bg-[#1a1f29] text-white/90 text-[11px] border-b border-white/5">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 flex items-center justify-between h-8 sm:h-9">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 rounded-full bg-[#C8A84E]/15 flex items-center justify-center">
              <Phone size={9} className="text-[#C8A84E]" />
            </div>
            <a href="wa.me/923432710491" target="_blank" className="font-medium text-[11px] tracking-wide">+92 343 2710491</a>
            <span className="text-white/30 mx-1.5 hidden sm:inline">|</span>
            <span className="text-white/40 text-[10px] hidden sm:inline">24/7 Customer Support</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Link
              href="/profile"
              className="flex items-center gap-1 hover:text-[#C8A84E] transition-all duration-300 group"
            >
              <User size={10} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-[10px] font-medium">My Account</span>
            </Link>
            <span className="text-white/10">|</span>
            <Link
              href="/cart"
              className="relative flex items-center gap-1 hover:text-[#C8A84E] transition-all duration-300 group"
            >
              <ShoppingCart size={10} className="group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline text-[10px] font-medium">Cart</span>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-2 sm:-top-2 sm:-right-2.5 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-[#C8A84E] px-0.5 text-[6px] font-bold text-white leading-none shadow-sm">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* ──────── MAIN NAVBAR ──────── */}
      <nav className={navbarClasses}>
        <div className="max-w-7xl mx-auto px-3 sm:px-6">
          <div className="flex min-h-[52px] items-center justify-between gap-2 sm:min-h-[58px] sm:gap-4">
            {/* ─── LOGO ─── */}
            <Link
              href="/"
              className="flex items-center gap-2 sm:gap-2.5 shrink-0 group"
            >
              <div className="relative">
                <div className="absolute inset-0 rounded-full bg-[#C8A84E]/20 blur-sm group-hover:blur-md transition-all duration-500 scale-110" />
                <img
                  src="/Irha Studio-12.jpg"
                  alt="Irhas'Inn"
                  className="relative h-10 w-auto sm:h-12 object-contain"
                />
              </div>
              <div className="flex flex-col">
                <span
                  className={clsx(
                    "text-sm sm:text-base font-bold tracking-tight transition-colors duration-300 leading-tight",
                    !isHomePage
                      ? "text-white"
                      : isScrolled
                        ? "text-[#222831]"
                        : "text-white",
                  )}
                >
                  Irhas'Inn
                </span>
                <span className={clsx(
                  "text-[8px] sm:text-[9px] font-semibold tracking-wider uppercase transition-colors duration-300 leading-tight",
                  !isHomePage
                    ? "text-white/60"
                    : isScrolled
                      ? "text-[#C8A84E]"
                      : "text-white/60"
                )}>
                  Customize Product All In One
                </span>
              </div>
            </Link>

            {/* ─── DESKTOP NAV LINKS ─── */}
            <div className="hidden lg:flex items-center gap-0.5">
              {NAV_LINKS.map((link) => (
                link.isHash ? (
                  <button
                    key={link.name}
                    onClick={() => {
                      if (isHomePage) {
                        const el = document.getElementById(link.href.replace('/#', ''));
                        if (el) el.scrollIntoView({ behavior: 'smooth' });
                      } else {
                        router.push(link.href);
                      }
                    }}
                    className={clsx(
                      "relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 group",
                      !isHomePage
                        ? "text-white/70 hover:text-white"
                        : isScrolled
                          ? "text-[#222831]/60 hover:text-[#222831]"
                          : "text-white/70 hover:text-white",
                    )}
                  >
                    {link.name}
                    <span className={clsx(
                      "absolute bottom-0 left-2 right-2 h-[2px] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left",
                      !isHomePage
                        ? "bg-white"
                        : isScrolled
                          ? "bg-[#C8A84E]"
                          : "bg-white"
                    )} />
                  </button>
                ) : (
                  <Link
                    key={link.name}
                    href={link.href}
                    className={clsx(
                      "relative px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-300 group",
                      !isHomePage
                        ? "text-white/70 hover:text-white"
                        : isScrolled
                          ? "text-[#222831]/60 hover:text-[#222831]"
                          : "text-white/70 hover:text-white",
                    )}
                  >
                    {link.name}
                    <span className={clsx(
                      "absolute bottom-0 left-2 right-2 h-[2px] rounded-full scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left",
                      !isHomePage
                        ? "bg-white"
                        : isScrolled
                          ? "bg-[#C8A84E]"
                          : "bg-white"
                    )} />
                  </Link>
                )
              ))}
            </div>

            {/* ─── SEARCH BAR (Desktop) ─── */}
            <div className="hidden md:flex flex-1 max-w-[380px]">
              <div className={clsx(
                "flex w-full items-center rounded-xl border bg-white shadow-sm overflow-hidden transition-all duration-300",
                searchFocused
                  ? "border-[#C8A84E] shadow-[0_0_0_3px_rgba(200,168,78,0.1)]"
                  : "border-gray-200 hover:border-gray-300 hover:shadow-md"
              )}>
                <div className="relative" ref={categoryDropdownRef}>
                  <button
                    type="button"
                    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
                    className="flex items-center gap-1 px-3 py-2 text-[10px] font-bold text-[#222831] border-r border-gray-100 hover:bg-gray-50 transition-colors whitespace-nowrap uppercase tracking-wider"
                  >
                    {selectedCategory}
                    <ChevronDown size={9} className={categoryDropdownOpen ? "rotate-180 transition-transform" : "transition-transform"} />
                  </button>
                  {categoryDropdownOpen && (
                    <div className="absolute top-full left-0 mt-1.5 w-40 bg-white border border-gray-100 rounded-xl shadow-xl z-50 py-1.5 overflow-hidden animate-dropdown-fade">
                      {CATEGORIES.map((cat) => (
                        <button
                          key={cat}
                          onClick={() => {
                            setSelectedCategory(cat);
                            setCategoryDropdownOpen(false);
                          }}
                          className={clsx(
                            "w-full text-left px-3.5 py-2 text-[11px] font-semibold hover:bg-gray-50 transition-colors",
                            cat === selectedCategory
                              ? "text-[#C8A84E] bg-[#C8A84E]/5 font-bold"
                              : "text-[#222831]",
                          )}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setSearchFocused(false)}
                  placeholder="Search products..."
                  className="flex-1 bg-transparent px-3 py-2 text-xs text-[#222831] outline-none placeholder:text-gray-400"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSearch();
                  }}
                />
                <button
                  onClick={() => handleSearch()}
                  className="bg-[#C8A84E] hover:bg-[#B8943F] active:bg-[#A8882E] text-white mr-2 px-2.5 rounded-full py-2 transition-all duration-200 hover:px-4"
                >
                  <Search size={13} strokeWidth={2.5} />
                </button>
              </div>
            </div>

            {/* ─── RIGHT ACTIONS (Desktop) ─── */}
            <div className="hidden md:flex items-center gap-1.5">
              {/* Cart icon */}
              <Link
                href="/cart"
                aria-label="Shopping Cart"
                className={clsx(
                  "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-200 group",
                  isScrolled || !isHomePage
                    ? "text-[#222831] hover:bg-gray-100 hover:shadow-sm"
                    : "text-white/80 hover:text-white hover:bg-white/10",
                )}
              >
                <ShoppingCart
                  size={17}
                  className={clsx(
                    "transition-all duration-300",
                    cartBounce && "animate-cart-bounce"
                  )}
                />
                {cartCount > 0 && (
                  <span className={clsx(
                    "absolute -right-0.5 -top-0.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-[#C8A84E] px-0.5 text-[7px] font-bold text-white leading-none shadow-sm transition-all duration-300",
                    cartBounce && "animate-badge-pop"
                  )}>
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>

              {/* Install App */}
              {!isAppInstalled && (deferredPrompt || isiOS) && (
                <>
                  <button
                    onClick={handleInstallClick}
                    className="rounded-xl bg-gradient-to-r from-[#C8A84E] to-[#B8943F] px-3 py-1.5 text-[9px] font-bold text-white transition-all duration-300 hover:shadow-lg hover:shadow-[#C8A84E]/25 hover:scale-105 active:scale-95"
                  >
                    <span className="flex items-center gap-1">
                      <Sparkles size={10} />
                      {isiOS ? "Install" : "Download"}
                    </span>
                  </button>
                </>
              )}

              {/* Auth */}
              {isMounted && isVerified ? (
                <div ref={userMenuRef} className="relative">
                  <button
                    onClick={handleUserMenuToggle}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 transition-all duration-200 group",
                      !isHomePage
                        ? "border-white/15 bg-white/10 text-white hover:bg-white/20"
                        : isScrolled
                          ? "border-gray-200 bg-white text-[#222831] hover:bg-gray-50 hover:border-gray-300 shadow-sm"
                          : "border-white/25 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm",
                    )}
                  >
                    {profilePic ? (
                      <img
                        src={profilePic}
                        className="h-5 w-5 sm:h-6 sm:w-6 rounded-full object-cover ring-2 ring-[#C8A84E]/30 transition-all"
                        alt=""
                      />
                    ) : (
                      <div className="flex h-5 w-5 sm:h-6 sm:w-6 items-center justify-center rounded-full bg-gradient-to-br from-[#C8A84E] to-[#B8943F] text-[9px] font-bold text-white shadow-sm">
                        {username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="max-w-[70px] truncate text-[11px] font-semibold capitalize leading-none">
                      {username}
                    </span>
                    <ChevronDown
                      size={9}
                      className={clsx(
                        "transition-transform duration-200",
                        userMenuOpen && "rotate-180"
                      )}
                    />
                  </button>

                  {userMenuOpen && (
                    <>
                      <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                      <div className="absolute right-0 top-full mt-2 w-52 overflow-hidden rounded-2xl border border-gray-100 bg-white text-[#222831] shadow-2xl shadow-black/10 z-50 animate-dropdown-fade">
                        {/* User preview */}
                        <div className="px-4 py-3.5 border-b border-gray-50 bg-gradient-to-r from-gray-50/50 to-transparent">
                          <div className="flex items-center gap-3">
                            {profilePic ? (
                              <img src={profilePic} className="h-9 w-9 rounded-full object-cover ring-2 ring-[#C8A84E]/20" alt="" />
                            ) : (
                              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-[#C8A84E] to-[#B8943F] text-sm font-bold text-white">
                                {username?.charAt(0).toUpperCase()}
                              </div>
                            )}
                            <div>
                              <p className="text-sm font-bold capitalize leading-tight">{username}</p>
                              <p className="text-[10px] text-[#C8A84E] font-semibold">Verified Account</p>
                            </div>
                          </div>
                        </div>

                        {/* Menu items */}
                        <div className="p-1.5">
                          <Link
                            href="/profile"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold hover:bg-gray-50 hover:text-[#C8A84E] transition-all group"
                          >
                            <User size={14} className="text-gray-400 group-hover:text-[#C8A84E] transition-colors" />
                            My Profile
                          </Link>
                          <Link
                            href="/profile/orders"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold hover:bg-gray-50 hover:text-[#C8A84E] transition-all group"
                          >
                            <Package size={14} className="text-gray-400 group-hover:text-[#C8A84E] transition-colors" />
                            My Orders
                          </Link>
                          <Link
                            href="/cart"
                            onClick={() => setUserMenuOpen(false)}
                            className="flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold hover:bg-gray-50 hover:text-[#C8A84E] transition-all group"
                          >
                            <ShoppingCart size={14} className="text-gray-400 group-hover:text-[#C8A84E] transition-colors" />
                            Shopping Cart
                            {cartCount > 0 && (
                              <span className="ml-auto flex h-5 min-w-5 items-center justify-center rounded-full bg-[#C8A84E] px-1.5 text-[8px] font-bold text-white">
                                {cartCount}
                              </span>
                            )}
                          </Link>
                          {isAdmin && (
                            <button
                              onClick={handleAdminPage}
                              className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold hover:bg-gray-50 hover:text-[#C8A84E] transition-all group"
                            >
                              <LayoutDashboard size={14} className="text-gray-400 group-hover:text-[#C8A84E] transition-colors" />
                              Admin Dashboard
                            </button>
                          )}
                        </div>

                        <div className="border-t border-gray-50 p-1.5">
                          <button
                            onClick={handleLogout}
                            className="flex w-full items-center gap-3 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-red-500 hover:bg-red-50 transition-all group"
                          >
                            <LogOut size={14} className="group-hover:scale-110 transition-transform" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => dispatch(openLogin())}
                    className="flex items-center gap-1.5 rounded-xl bg-[#C8A84E] px-4 py-2 text-[11px] font-bold text-white transition-all duration-300 hover:bg-[#B8943F] hover:shadow-lg hover:shadow-[#C8A84E]/20 active:scale-95"
                  >
                    <LogIn size={12} />
                    Login
                  </button>
                  <button
                    onClick={() => dispatch(openSignup())}
                    className={clsx(
                      "flex items-center gap-1.5 rounded-xl px-4 py-2 text-[11px] font-bold transition-all duration-300 active:scale-95",
                      isScrolled || !isHomePage
                        ? "bg-[#222831] text-white hover:bg-[#C8A84E] hover:shadow-lg hover:shadow-[#C8A84E]/20"
                        : "border border-white/30 bg-white/10 text-white backdrop-blur-md hover:bg-white/20 hover:border-white/50",
                    )}
                  >
                    <UserPlus size={12} />
                    Sign Up
                  </button>
                </div>
              )}
            </div>

            {/* ─── MOBILE: Cart + Hamburger ─── */}
            <div className="flex items-center gap-1 md:hidden">
              <Link
                href="/cart"
                aria-label="Cart"
                className={clsx(
                  "relative flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90",
                  isScrolled || !isHomePage
                    ? "text-[#222831] hover:bg-gray-100"
                    : "text-white/80 hover:text-white hover:bg-white/10",
                )}
              >
                <ShoppingCart size={18} />
                {cartCount > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#C8A84E] px-0.5 text-[7px] font-bold text-white shadow-sm">
                    {cartCount > 99 ? "99+" : cartCount}
                  </span>
                )}
              </Link>
              <button
                onClick={() => setMenuOpen(true)}
                aria-label="Open Menu"
                className={clsx(
                  "flex h-9 w-9 items-center justify-center rounded-xl transition-all active:scale-90",
                  isScrolled || !isHomePage
                    ? "text-[#222831] hover:bg-gray-100"
                    : "text-white/80 hover:text-white hover:bg-white/10",
                )}
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ──────── MOBILE DRAWER ──────── */}
      {menuOpen && (
        <div className="fixed inset-0 z-[100] md:hidden">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute right-0 top-0 flex h-full w-full max-w-sm flex-col bg-white shadow-2xl animate-slide-in-right">
            {/* Drawer Header */}
            <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
              <Link
                href="/"
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2.5 group"
              >
                <div className="relative">
                  <div className="absolute inset-0 rounded-full bg-[#C8A84E]/15 blur-sm" />
                  <img
                    src="/Irha Studio-12.jpg"
                    alt="Logo"
                    className="relative h-10 w-auto object-contain"
                  />
                </div>
                <div>
                  <span className="block font-bold text-sm text-[#222831] leading-tight">
                    Irhas'Inn
                  </span>
                  <span className="text-[9px] text-[#C8A84E] font-semibold tracking-wider uppercase">
                    Premium Shopping
                  </span>
                </div>
              </Link>
              <button
                onClick={() => setMenuOpen(false)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-gray-100 text-[#222831] hover:bg-gray-200 transition-all active:scale-90"
              >
                <X size={16} />
              </button>
            </div>

            {/* Search */}
            <div className="border-b border-gray-100 p-4 sm:p-5">
              <form onSubmit={handleSearch}>
                <div className="flex items-center rounded-xl border border-gray-200 bg-gray-50 p-1 focus-within:border-[#C8A84E] focus-within:bg-white focus-within:shadow-[0_0_0_3px_rgba(200,168,78,0.1)] transition-all duration-200">
                  <Search size={14} className="ml-3 text-gray-400" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products..."
                    className="flex-1 bg-transparent px-2.5 py-2.5 text-sm text-[#222831] outline-none placeholder:text-gray-400"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#C8A84E] px-3.5 py-2 text-[10px] font-bold text-white hover:bg-[#B8943F] transition-all active:scale-95"
                  >
                    Search
                  </button>
                </div>
              </form>
            </div>

            <div className="flex-1 overflow-y-auto">
              {/* Nav Links */}
              <div className="p-4 sm:p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">
                  Navigation
                </p>
                <div className="space-y-0.5">
                  {NAV_LINKS.map((link) => (
                    link.isHash ? (
                      <button
                        key={link.name}
                        onClick={() => {
                          setMenuOpen(false);
                          if (isHomePage) {
                            const el = document.getElementById(link.href.replace('/#', ''));
                            if (el) el.scrollIntoView({ behavior: 'smooth' });
                          } else {
                            router.push(link.href);
                          }
                        }}
                        className="flex w-full items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-[#222831] hover:bg-gray-50 hover:text-[#C8A84E] transition-all group"
                      >
                        {link.name}
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-[#C8A84E] group-hover:translate-x-1 transition-all" />
                      </button>
                    ) : (
                      <Link
                        key={link.name}
                        href={link.href}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center justify-between rounded-xl px-3.5 py-3 text-sm font-semibold text-[#222831] hover:bg-gray-50 hover:text-[#C8A84E] transition-all group"
                      >
                        {link.name}
                        <ChevronRight size={14} className="text-gray-300 group-hover:text-[#C8A84E] group-hover:translate-x-1 transition-all" />
                      </Link>
                    )
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="border-t border-gray-100 p-4 sm:p-5">
                <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-gray-400 mb-3">
                  Categories
                </p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((category) => (
                    <button
                      key={category}
                      onClick={() => handleCategoryClick(category)}
                      className="rounded-full border border-gray-200 bg-white px-3.5 py-2 text-[11px] font-semibold text-[#222831] hover:border-[#C8A84E] hover:text-[#C8A84E] hover:bg-[#C8A84E]/5 active:scale-95 transition-all duration-200"
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Auth / User Section */}
            <div className="border-t border-gray-100 p-4 sm:p-5 bg-gradient-to-b from-transparent to-gray-50/50">
              {isMounted && isVerified ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-3 rounded-xl bg-white border border-gray-100 p-3 shadow-sm">
                    {profilePic ? (
                      <img
                        src={profilePic}
                        className="h-10 w-10 rounded-full object-cover ring-2 ring-[#C8A84E]/20"
                        alt=""
                      />
                    ) : (
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#C8A84E] to-[#A8882E] font-bold text-white text-sm shadow-sm">
                        {username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold capitalize text-[#222831] truncate">
                        {username}
                      </p>
                      <p className="text-[9px] font-semibold text-[#C8A84E]">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#C8A84E] mr-1 align-middle" />
                        Verified Account
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-100 py-2.5 text-[11px] font-semibold text-[#222831] hover:border-[#C8A84E] hover:text-[#C8A84E] transition-all active:scale-95 shadow-sm"
                    >
                      <User size={13} /> Profile
                    </Link>
                    <Link
                      href="/profile/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center justify-center gap-2 rounded-xl bg-white border border-gray-100 py-2.5 text-[11px] font-semibold text-[#222831] hover:border-[#C8A84E] hover:text-[#C8A84E] transition-all active:scale-95 shadow-sm"
                    >
                      <Package size={13} /> Orders
                    </Link>
                  </div>

                  {!isAppInstalled && (deferredPrompt || isiOS) && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full rounded-xl bg-gradient-to-r from-[#C8A84E] to-[#B8943F] py-3 text-xs font-bold text-white hover:shadow-lg hover:shadow-[#C8A84E]/20 transition-all active:scale-[0.98]"
                    >
                      <span className="flex items-center justify-center gap-1.5">
                        <Sparkles size={14} />
                        {isiOS ? "Install on iOS" : "Download App"}
                      </span>
                    </button>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href = "/editProfile";
                      }}
                      className="rounded-xl border border-gray-200 bg-white py-2.5 text-[11px] font-semibold text-[#222831] hover:border-[#C8A84E] hover:text-[#C8A84E] transition-all active:scale-95"
                    >
                      Edit Profile
                    </button>
                    {isAdmin ? (
                      <button
                        onClick={() => {
                          setMenuOpen(false);
                          handleAdminPage();
                        }}
                        className="rounded-xl bg-[#222831] py-2.5 text-[11px] font-semibold text-white hover:bg-[#C8A84E] transition-all active:scale-95"
                      >
                        Admin Panel
                      </button>
                    ) : (
                      <button
                        onClick={handleLogout}
                        className="rounded-xl bg-[#222831] py-2.5 text-[11px] font-semibold text-white hover:bg-red-500 transition-all active:scale-95"
                      >
                        Logout
                      </button>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      onClick={handleLogout}
                      className="w-full rounded-xl border border-gray-200 bg-white py-2.5 text-[11px] font-semibold text-red-500 hover:bg-red-50 hover:border-red-200 transition-all active:scale-95"
                    >
                      Sign Out
                    </button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-2.5">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(openLogin());
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl bg-[#C8A84E] py-3 text-xs font-bold text-white hover:bg-[#B8943F] hover:shadow-lg hover:shadow-[#C8A84E]/20 transition-all active:scale-[0.97]"
                  >
                    <LogIn size={14} /> Login
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(openSignup());
                    }}
                    className="flex items-center justify-center gap-2 rounded-xl border-2 border-gray-200 bg-white py-3 text-xs font-bold text-[#222831] hover:border-[#C8A84E] hover:text-[#C8A84E] transition-all active:scale-[0.97]"
                  >
                    <UserPlus size={14} /> Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ──────── iOS Install Instructions Modal ──────── */}
      {showIOSInstructions && (
        <div className="fixed inset-0 z-[200] flex items-end justify-center bg-black/50 backdrop-blur-sm p-0 sm:items-center sm:p-6">
          <div className="w-full max-w-sm rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-2xl animate-slide-up">
            <div className="text-center mb-5">
              <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#222831]">
                <img
                  src="/Irha Studio-12.jpg"
                  alt="Irhas'Inn"
                  className="h-10 w-10 rounded-xl object-cover"
                />
              </div>
              <h3 className="text-lg font-bold text-[#222831]">
                Install Irhas'Inn
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                Add to your home screen for the best experience
              </p>
            </div>

            <ol className="space-y-3 mb-5">
              <li className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C8A84E] text-[10px] font-bold text-white">1</span>
                <span className="text-xs font-medium text-gray-700">
                  Tap the <strong>Share</strong> button <span className="text-base">📤</span> in Safari
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C8A84E] text-[10px] font-bold text-white">2</span>
                <span className="text-xs font-medium text-gray-700">
                  Scroll down and tap <strong>"Add to Home Screen"</strong>
                </span>
              </li>
              <li className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#C8A84E] text-[10px] font-bold text-white">3</span>
                <span className="text-xs font-medium text-gray-700">
                  Tap <strong>"Add"</strong> in the top-right corner
                </span>
              </li>
            </ol>

            <button
              onClick={() => setShowIOSInstructions(false)}
              className="w-full rounded-xl bg-[#C8A84E] py-3 text-sm font-bold text-white hover:bg-[#B8943F] transition-colors active:scale-[0.98]"
            >
              Got it
            </button>
          </div>
        </div>
      )}

      {/* ──────── ANIMATION KEYFRAMES ──────── */}
      <style jsx global>{`
        @keyframes dropdownFade {
          from { opacity: 0; transform: translateY(-6px) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes slideInRight {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(32px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes cartBounce {
          0%, 100% { transform: scale(1); }
          25% { transform: scale(1.3); }
          50% { transform: scale(0.9); }
          75% { transform: scale(1.1); }
        }
        @keyframes badgePop {
          0% { transform: scale(1); }
          50% { transform: scale(1.5); opacity: 0.7; }
          100% { transform: scale(1); }
        }
        .animate-dropdown-fade {
          animation: dropdownFade 0.2s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-slide-in-right {
          animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out both;
        }
        .animate-slide-up {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) both;
        }
        .animate-cart-bounce {
          animation: cartBounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        .animate-badge-pop {
          animation: badgePop 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
      `}</style>
    </div>
  );
};

export default Navbar;
