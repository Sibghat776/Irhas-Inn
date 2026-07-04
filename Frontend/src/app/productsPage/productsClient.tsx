"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

export default function ProductsClient() {
  const searchParams = useSearchParams();
  const category = searchParams.get("category");

  return (
    <div>
      <h1>Products Page</h1>
      <p>Selected Category: {category}</p>
    </div>
  );
}
