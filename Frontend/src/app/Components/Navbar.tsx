"use client";

import { useEffect, useState, useCallback } from "react";
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
} from "lucide-react";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import useFetch, { baseUrl, showToast } from "../utils/commonFunctions";
import axios from "axios";

const NAV_LINKS = [
  { name: "Home", href: "/" },
  { name: "About", href: "/#about" },
  { name: "Products", href: "/#collection" },
  { name: "Cart", href: "/cart" },
  { name: "Contact", href: "/#contact" },
];

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: "accepted" | "dismissed";
    platform: string;
  }>;
  prompt(): Promise<void>;
}

const Navbar: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const pathname = usePathname();

  const { username, isVerified, profilePic } = useSelector(
    (state: RootState) => state.auth,
  );

  const isHomePage = pathname === "/";
  const [isScrolled, setIsScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [cartCount, setCartCount] = useState(0);
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [isAppInstalled, setIsAppInstalled] = useState(false);

  const authData = useSelector((state: RootState) => state.auth);

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

  useEffect(() => {
    if (authData.username) return;
    const updateCartCount = () => {
      try {
        const cart = JSON.parse(localStorage.getItem("zeef_store_cart") ?? "[]");
        const total = cart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
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

  useEffect(() => {
    if (!authData.username) return;
    const fetchBackendCart = async () => {
      try {
        const res = await axios.get(`${baseUrl}cart/`, { withCredentials: true });
        const items = res.data.data || [];
        const total = items.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
        setCartCount(total);
      } catch {
        /* ignore */
      }
    };
    fetchBackendCart();
    const handleCartUpdate = () => fetchBackendCart();
    window.addEventListener("cart-updated", handleCartUpdate);
    return () => window.removeEventListener("cart-updated", handleCartUpdate);
  }, [authData.username]);

  useEffect(() => {
    const handleBeforeInstallPrompt = (event: any) => {
      event.preventDefault();
      setDeferredPrompt(event);
    };

    const handleAppInstalled : any= () => {
      setIsAppInstalled(true);
      setDeferredPrompt(null);
    };

    setIsAppInstalled(isStandaloneMode());

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener(
        "beforeinstallprompt",
        handleBeforeInstallPrompt,
      );
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "auto";
    return () => {
      document.body.style.overflow = "auto";
    };
  }, [menuOpen]);

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

  const { data: userData } = useFetch<myResponseData>(
    authData.username ? `${baseUrl}auth/getUser/${authData.username}` : "",
  );

  useEffect(() => {
    if (userData?.data) {
      setIsAdmin(userData?.data?.isAdmin);
      // Keep localStorage role in sync with fresh server data
      const stored = localStorage.getItem("user");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          const freshRole = userData.data.role ?? (userData.data.isAdmin ? "superadmin" : "user");
          if (parsed.role !== freshRole) {
            localStorage.setItem("user", JSON.stringify({ ...parsed, role: freshRole }));
          }
        } catch {}
      }
    }
  }, [userData]);

  const handleScroll = useCallback(() => {
    setIsScrolled(window.scrollY > 40);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [handleScroll]);

  const navbarClasses = clsx(
    "fixed top-0 left-0 right-0 z-50 transition-all duration-500 ease-in-out py-3",
    isScrolled
      ? "bg-white shadow-md border-b border-gray-200 text-[#041241]"
      : "bg-transparent text-white",
  );

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

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setDeferredPrompt(null);
    }
  };

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) dispatch(loginSuccess(JSON.parse(user)));
  }, [dispatch]);

  // ========== NOTIFICATIONS: fetch unread count on app load ==========
  const fetchUnreadCount = useCallback(async () => {
    if (!authData.username) return;
    try {
      const res = await axios.get(`${baseUrl}notifications/`, {
        withCredentials: true,
      });
      const all = res.data.data || [];
      const unread = all.filter((n: any) => !n.isRead).length;
      console.log(
        `[Navbar Notifications] ${unread} unread out of ${all.length}`,
      );
      setUnreadCount(unread);
    } catch {
      setUnreadCount(0);
    }
  }, [authData.username]);

  useEffect(() => {
    if (authData.username) {
      fetchUnreadCount();
      const interval = setInterval(fetchUnreadCount, 30000);
      const handleRead = () => { setUnreadCount(0); };
      window.addEventListener("notifications-read", handleRead);
      return () => {
        clearInterval(interval);
        window.removeEventListener("notifications-read", handleRead);
      };
    }
  }, [authData.username, fetchUnreadCount]);

  const handleUserMenuToggle = () => {
    setUserMenuOpen((prev) => !prev);
  };

  const handleAdminPage = () => {
    try {
      setUserMenuOpen(false);
      if (isAdmin) {
        window.location.href = "/Admin/Overview";
      } else {
        showToast("Unauthorized: Admin access only", "error");
      }
    } catch (error) {
      console.log(error);
      showToast("Failed to access admin panel", "error");
    }
  };

  const handleMobileAdminPage = () => {
    try {
      setMenuOpen(false);
      if (isAdmin) {
        window.location.href = "/Admin/Overview";
      } else {
        showToast("Unauthorized: Admin access only", "error");
      }
    } catch (error) {
      console.log(error);
      showToast("Failed to access admin panel", "error");
    }
  };

  return (
    <nav className={navbarClasses}>
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        {/* Brand */}
        <Link
          href="/"
          className="text-2xl md:text-3xl font-bold flex items-center gap-3 tracking-tight active:scale-95 transition-all duration-300"
        >
          <img
            src="/Logo.png"
            alt="Logo"
            className="h-10 w-10 rounded-full border border-white/30 object-cover"
          />
          <span
            className={clsx(
              "font-bold text-lg",
              isScrolled ? "text-black" : "text-white",
            )}
          >
            ZeeF Trendy Store
          </span>
        </Link>
        <div className="hidden md:flex items-center gap-8">
          {NAV_LINKS.map((item, i) => (
            <Link
              key={i}
              href={item.href}
              className={clsx(
                "relative text-sm font-semibold transition-colors duration-300 pb-1 border-b-2 border-transparent",
                isScrolled || !isHomePage
                  ? "text-gray-700 hover:text-[#0856DF] hover:border-[#0856DF]"
                  : "text-white/90 hover:text-white hover:border-white",
              )}
            >
              {item.name}
              {item.name === "Cart" && cartCount > 0 && (
                <span className="absolute -top-2 -right-3 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                  {cartCount}
                </span>
              )}
            </Link>
          ))}

          {deferredPrompt && !isAppInstalled && (
            <button
              onClick={handleInstallClick}
              className={clsx(
                "px-4 py-2 rounded-lg font-semibold transition-all duration-300",
                isScrolled
                  ? "bg-[#0856DF] text-white hover:bg-[#064ec4]"
                  : "bg-white/10 border border-white/30 text-white hover:bg-white/20",
              )}
            >
              Download App
            </button>
          )}

          {isMounted && isVerified ? (
            <div className="relative flex items-center gap-3">
              <div className="relative">
                <button
                  onClick={handleUserMenuToggle}
                  className={clsx(
                    "flex items-center gap-2 px-4 py-2 rounded-lg border transition-all duration-300",
                    isScrolled
                      ? "bg-gray-50 border-gray-300 text-[#041241] hover:bg-gray-100"
                      : "bg-white/10 border-white/30 text-white hover:bg-white/20",
                  )}
                >
                  {profilePic ? (
                    <img
                      src={profilePic}
                      className="w-7 h-7 rounded-full object-cover"
                      alt="profile"
                    />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-[#0856DF] flex items-center justify-center text-white text-xs font-bold">
                      {username?.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <span className="capitalize font-semibold text-sm">
                    {username}
                  </span>
                  <div className="relative">
                    <Bell size={14} />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white" />
                    )}
                  </div>
                  {userMenuOpen ? (
                    <ChevronUp size={14} />
                  ) : (
                    <ChevronDown size={14} />
                  )}
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-gray-200 text-[#041241] z-50 overflow-hidden">
                    <div className="flex flex-col border-b border-gray-100 py-1">
                      <Link
                        href="/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-red-50 text-red-600 hover:text-red-700 transition-colors whitespace-nowrap"
                      >
                        <User size={16} /> Profile
                      </Link>
                      <Link
                        href="/profile/orders"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg  hover:bg-yellow-50 text-yellow-600 hover:text-yellow-600  transition-colors whitespace-nowrap"
                      >
                        <Package size={16} /> Orders
                      </Link>
                      <Link
                        href="/profile/notifications"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-blue-50 text-[#0856DF] hover:text-[#0856DF] transition-colors whitespace-nowrap relative"
                      >
                        <Bell size={16} /> Notifications
                        {unreadCount > 0 && (
                          <span className="ml-0.5 w-2 h-2 bg-red-500 rounded-full" />
                        )}
                      </Link>
                      <Link
                        href="/cart"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-blue-50 text-green-500 hover:text-green-600 transition-colors whitespace-nowrap"
                      >
                        <ShoppingCart size={16} /> Cart
                        {cartCount > 0 && (
                          <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                            {cartCount}
                          </span>
                        )}
                      </Link>
                      {isAdmin && (
                        <button
                          onClick={handleAdminPage}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-amber-50 text-amber-600 transition-colors whitespace-nowrap"
                        >
                          <LayoutDashboard size={16} /> Admin
                        </button>
                      )}
                    </div>
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-lg hover:bg-red-50 text-red-600 transition-colors whitespace-nowrap w-full"
                      >
                        <LogOut size={16} /> Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <button
                onClick={() => dispatch(openLogin())}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#0856DF] hover:bg-[#064ec4] active:scale-95 transition-all duration-300"
              >
                <LogIn size={16} /> Login
              </button>
              <button
                onClick={() => dispatch(openSignup())}
                className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white bg-[#E63E5C] hover:bg-[#d63450] active:scale-95 transition-all duration-300"
              >
                <UserPlus size={16} /> Sign Up
              </button>
            </div>
          )}
        </div>

        {/* Mobile Hamburger */}
        <div className="md:hidden flex items-center">
          <button
            onClick={() => setMenuOpen(true)}
            className={clsx(
              "p-2 rounded-lg transition-all duration-300",
              isScrolled
                ? "bg-gray-100 text-[#041241] hover:bg-gray-200"
                : "bg-white/10 text-white hover:bg-white/20 border border-white/20",
            )}
            aria-label="Open Navigation Menu"
          >
            <Menu size={24} />
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-[100] bg-black/30 transition-opacity duration-300 flex justify-end">
          <div
            className="absolute inset-0 -z-10 cursor-pointer"
            onClick={() => setMenuOpen(false)}
          ></div>
          <div className="w-full max-w-xs bg-white h-full shadow-lg flex flex-col justify-between p-6 rounded-l-2xl border-l border-gray-200">
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <img
                    src="Logo.png"
                    alt="Logo"
                    className="h-9 w-9 rounded-full object-cover border border-gray-300"
                  />
                  <span className="font-bold text-lg text-black">
                    ZeeF Trendy Store
                  </span>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-300"
                  aria-label="Close Navigation Menu"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="mt-6 space-y-1">
                {NAV_LINKS.map((item, i) => (
                  <Link
                    key={i}
                    href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center py-3 px-4 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#0856DF] hover:bg-blue-50 transition-all duration-300"
                  >
                    {item.name}
                  </Link>
                ))}
              </div>
            </div>

            {/* Mobile Auth */}
            <div className="mt-auto pt-6 border-t border-gray-200 space-y-4">
              {isMounted && isVerified ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg">
                    {profilePic ? (
                      <img
                        src={profilePic || "/defaultAvatar.png"}
                        className="w-10 h-10 rounded-full object-cover"
                        alt="profile"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-[#0856DF] flex items-center justify-center text-white font-bold text-sm">
                        {username?.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-[#041241] capitalize">
                        {username}
                      </p>
                      <p className="text-xs text-[#0856DF] font-semibold">
                        Verified
                      </p>
                    </div>
                  </div>

                  {/* Mobile Nav Links for Profile */}
                  <div className="space-y-1">
                    <Link
                      href="/profile"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#0856DF] hover:bg-blue-50 transition-colors"
                    >
                      <User size={16} /> Profile
                    </Link>
                    <Link
                      href="/profile/orders"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#0856DF] hover:bg-blue-50 transition-colors"
                    >
                      <Package size={16} /> Orders
                    </Link>
                    <Link
                      href="/profile/notifications"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#0856DF] hover:bg-blue-50 transition-colors"
                    >
                      <Bell size={16} /> Notifications
                      {unreadCount > 0 && (
                        <span className="ml-auto w-2 h-2 bg-red-500 rounded-full" />
                      )}
                    </Link>
                    <Link
                      href="/cart"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-2.5 px-3 rounded-lg text-sm font-semibold text-gray-700 hover:text-[#0856DF] hover:bg-blue-50 transition-colors"
                    >
                      <ShoppingCart size={16} /> Cart
                      {cartCount > 0 && (
                        <span className="ml-auto min-w-[20px] h-5 flex items-center justify-center rounded-full bg-red-500 text-white text-[10px] font-bold px-1">
                          {cartCount}
                        </span>
                      )}
                    </Link>
                  </div>


                  {deferredPrompt && !isAppInstalled && (
                    <button
                      onClick={handleInstallClick}
                      className="w-full py-2.5 px-4 rounded-lg text-center text-sm font-semibold bg-[#0856DF] text-white hover:bg-[#064ec4] transition-colors"
                    >
                      Download App
                    </button>
                  )}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        setMenuOpen(false);
                        window.location.href = "/editProfile";
                      }}
                      className="py-2.5 px-3 rounded-lg text-center text-xs font-semibold bg-blue-50 text-[#0856DF] hover:bg-blue-100 transition-colors"
                    >
                      Edit Profile
                    </button>
                    {isAdmin ? (
                      <button
                        onClick={handleMobileAdminPage}
                        className="py-2.5 px-3 rounded-lg text-center text-xs font-semibold bg-amber-50 text-amber-600 hover:bg-amber-100 transition-colors"
                      >
                        Admin Panel
                      </button>
                    ) : (
                      <button
                        onClick={handleLogout}
                        className="py-2.5 px-3 rounded-lg text-center text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                      >
                        Logout
                      </button>
                    )}
                  </div>
                  {isAdmin && (
                    <button
                      onClick={handleLogout}
                      className="w-full py-2.5 px-4 rounded-lg text-center text-xs font-semibold bg-red-50 text-red-600 hover:bg-red-100 transition-colors"
                    >
                      Logout
                    </button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(openLogin());
                    }}
                    className="w-full py-2.5 rounded-lg text-center text-sm font-semibold bg-[#0856DF] text-white hover:bg-[#064ec4] transition-colors flex justify-center items-center gap-2"
                  >
                    <LogIn size={16} /> Login
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      dispatch(openSignup());
                    }}
                    className="w-full py-2.5 rounded-lg text-center text-sm font-semibold bg-white border-2 border-gray-300 text-[#041241] hover:bg-gray-50 transition-colors flex justify-center items-center gap-2"
                  >
                    <UserPlus size={16} /> Sign Up
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes drawerSlideLeft {
          from {
            transform: translateX(100%);
            opacity: 0.8;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </nav>
  );
};

export default Navbar;
