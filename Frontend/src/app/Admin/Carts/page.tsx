"use client";

import { useEffect, useMemo, useState } from "react";
import { ShoppingCart } from "lucide-react";
import useFetch, { baseUrl } from "@/app/utils/commonFunctions";

interface CartProduct {
  _id: string;
  name: string;
  price: number;
  images?: Array<{ url: string }>;
  stock?: number;
}

interface CartItem {
  _id?: string;
  product?: CartProduct | null;
  quantity: number;
}

interface UserCart {
  _id: string;
  username: string;
  email: string;
  phoneNo?: string | null;
  cart: CartItem[];
}

const CartsPage = () => {
  const { data: usersRes, loading } = useFetch<any>(`${baseUrl}auth/getUsers`);
  const [carts, setCarts] = useState<UserCart[]>([]);

  useEffect(() => {
    if (usersRes?.data) {
      const users = Array.isArray(usersRes.data) ? usersRes.data : [];
      const activeCarts = users.filter(
        (user: UserCart) => Array.isArray(user.cart) && user.cart.length > 0,
      );
      setCarts(activeCarts);
    }
  }, [usersRes]);

  const totals = useMemo(() => {
    const totalItems = carts.reduce(
      (sum, user) => sum + user.cart.reduce((itemSum, item) => itemSum + (item.quantity || 1), 0),
      0,
    );
    const totalValue = carts.reduce(
      (sum, user) =>
        sum +
        user.cart.reduce((itemSum, item) => {
          const price = item.product?.price ?? 0;
          return itemSum + price * (item.quantity || 1);
        }, 0),
      0,
    );

    return { totalItems, totalValue };
  }, [carts]);

  return (
    <div className="bg-white border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] p-8">
      <div className="mb-8 pb-6 border-b-4 border-black">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-3">
          <div>
            <h2 className="text-3xl font-black uppercase tracking-tight flex items-center gap-3">
              Customer Carts
              <span className="bg-black text-white px-3 py-1 text-sm">
                {carts.length}
              </span>
            </h2>
            <p className="text-sm font-bold text-zinc-500 uppercase tracking-widest mt-2">
              Live carts from the database
            </p>
          </div>
          <div className="text-sm font-black uppercase tracking-widest text-zinc-700">
            <p>{totals.totalItems} items</p>
            <p>Value: Rs {totals.totalValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="border-4 border-black p-8 text-center font-black uppercase">
          Loading carts...
        </div>
      ) : carts.length === 0 ? (
        <div className="border-4 border-black p-8 text-center font-black uppercase text-zinc-600">
          No carts found in the database.
        </div>
      ) : (
        <div className="space-y-4">
          {carts.map((user) => {
            const itemCount = user.cart.reduce(
              (sum, item) => sum + (item.quantity || 1),
              0,
            );
            const cartValue = user.cart.reduce((sum, item) => {
              const price = item.product?.price ?? 0;
              return sum + price * (item.quantity || 1);
            }, 0);

            return (
              <div
                key={user._id}
                className="flex flex-col lg:flex-row lg:items-start lg:justify-between p-6 border-4 border-black hover:bg-zinc-50 transition-colors gap-6"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h4 className="text-xl font-black uppercase">{user.username}</h4>
                    <span className="text-xs font-bold bg-zinc-200 px-2 py-1 uppercase">
                      {itemCount} items
                    </span>
                  </div>
                  <p className="text-sm font-bold text-zinc-500 uppercase">
                    {user.email}
                  </p>
                  {user.phoneNo ? (
                    <p className="text-sm font-bold text-zinc-500 uppercase mt-1">
                      {user.phoneNo}
                    </p>
                  ) : null}
                  <div className="mt-4 space-y-2">
                    {user.cart.map((item, index) => (
                      <div
                        key={`${user._id}-${index}`}
                        className="flex items-center justify-between border border-black px-3 py-2 text-sm font-bold uppercase"
                      >
                        <span>
                          {item.product?.name || "Product unavailable"} × {item.quantity}
                        </span>
                        <span>Rs {(item.product?.price ?? 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="text-left lg:text-right flex flex-col gap-3 min-w-[180px]">
                  <p className="text-2xl font-black">Rs {cartValue.toLocaleString()}</p>
                  <div className="flex items-center gap-2 border-2 border-black bg-zinc-100 px-4 py-3 font-black uppercase tracking-widest text-xs">
                    <ShoppingCart className="w-4 h-4" /> Live from DB
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CartsPage;
