import { toast, ToastOptions, Theme } from "react-toastify";
import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { useEffect, useState } from "react";

// Explicitly type the Toast types and theme allowed by react-toastify
export type ToastType = "success" | "info" | "warn" | "error";

export function showToast(
  message: string,
  type: ToastType = "error",
  theme: Theme = "dark",
): void {
  const options: ToastOptions = {
    position: "top-right",
    autoClose: 1000,
    hideProgressBar: false,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    theme,
  };

  if (type === "success") {
    toast.success(message, options);
  } else if (type === "info") {
    toast.info(message, options);
  } else if (type === "warn") {
    toast.warn(message, options);
  } else {
    toast.error(message, options);
  }
}

export const getLocalCart = () => {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem("irhasinn_cart") ?? "[]");
  } catch {
    return [];
  }
};

export const setLocalCart = (cart: any[]) => {
  if (typeof window === "undefined") return;
  localStorage.setItem("irhasinn_cart", JSON.stringify(cart));
};

export const addToLocalCart = (product: any, quantity = 1) => {
  if (typeof window === "undefined") return [];
  const currentCart = getLocalCart();
  const existing = currentCart.find((item: any) => item._id === product._id);

  if (existing) {
    existing.quantity += quantity;
  } else {
    currentCart.push({ ...product, quantity });
  }

  setLocalCart(currentCart);
  return currentCart;
};

export const removeFromLocalCart = (productId: string) => {
  if (typeof window === "undefined") return [];
  const currentCart = getLocalCart();
  const newCart = currentCart.filter((item: any) => item._id !== productId);
  setLocalCart(newCart);
  return newCart;
};

// Added <T = any> generic to accept your custom response types dynamically
const useFetch = <T = any>(url: string) => {
  // Initialized state as T or null so TypeScript knows what kind of data to expect
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AxiosError | Error | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError(null); // Reset error state on new request
      try {
        const res = await axios.get<T>(url, { withCredentials: true });
        setData(res.data);
      } catch (err) {
        setError(err as AxiosError);
        showToast("Error fetching data", "error");
      } finally {
        setLoading(false);
      }
    };

    if (url) fetchData();
  }, [url]);

  const reFetch = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get<T>(url, { withCredentials: true });
      setData(res.data);
    } catch (err) {
      setError(err as AxiosError);
    } finally {
      setLoading(false);
    }
  };

  return { data, loading, error, reFetch };
};

export default useFetch;

// Axios response interceptor — catch 403/401 globally and log out gracefully
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 403 || error?.response?.status === 401) {
      const msg = error?.response?.data?.message || "";
      if (msg.includes("Token") || msg.includes("authenticated") || msg.includes("authorized")) {
        if (typeof window !== "undefined") {
          localStorage.removeItem("user");
          // Full page reload to reset Redux store and redirect to home
          showToast("Session expired, please log in again", "error");
          setTimeout(() => { window.location.href = "/"; }, 1200);
        }
      }
    }
    return Promise.reject(error);
  }
);

export const baseUrl =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1/";


