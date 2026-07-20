"use client";
import { useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
import axios, { AxiosError } from "axios";
import ProductCard from "../Components/ProductCard";
import { showToast } from "../utils/commonFunctions"; // ya jahan se import hota hai
import LoadingOverlay from "../Components/LoadingOverlay";

interface SearchResult {
  products: any[];
  count: number;
  intent: any;
}

const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api/v1/";

function AISearchResultsInner() {
  const searchParams = useSearchParams();
  const query = searchParams.get("q") || "";

  const [data, setData] = useState<SearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<AxiosError | Error | null>(null);

  const fetchSearchResults = async (searchQuery: string) => {
    if (!searchQuery) return;

    setLoading(true);
    setError(null);

    try {
      const res = await axios.post<{ data: SearchResult }>(
        `${baseUrl}product/ai/search-products`, // Fixed endpoint path
        { query: searchQuery },
        {
          withCredentials: true,
          headers: { "Content-Type": "application/json" }
        }
      );

      if (res.data?.data?.products) {
        setData(res.data.data);
        showToast(`Found ${res.data.data.count} product(s)`, "success");
      } else {
        showToast("No products found", "info");
        setData(null);
      }
    } catch (err) {
      const axiosError = err as AxiosError;
      setError(axiosError);
      showToast("Error fetching AI search results", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch results jab query change ho
  useEffect(() => {
    fetchSearchResults(query);
  }, [query]);

  // Handle states
  if (!query) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">No search query provided.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div>
        <LoadingOverlay />
      </div>
    );
  }

  if (error || !data || data.products.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-red-500">
          ❌ No products found for "{query}".
        </p>
        <button
          onClick={() => fetchSearchResults(query)}
          className="mt-3 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          🔄 Retry Search
        </button>
      </div>
    );
  }

  // Success state - render results
  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2 mt-14">
          🤖 AI Search Results for "{query}"
        </h1>
        <p className="text-gray-600">
          Found <span className="font-semibold text-blue-600">{data.count}</span> product(s) matching your query
        </p>
        {data.intent && (
          <p className="text-sm text-gray-500 mt-2">
            Intent: <span className="italic">
              {Array.isArray(data.intent.keywords) ? data.intent.keywords.join(', ') : ''}
            </span>
          </p>
        )}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {data.products.map((product) => (
          <ProductCard key={product._id} product={product} />
        ))}
      </div>

      {/* Retry Button */}
      <div className="mt-8 text-center">
        <button
          onClick={() => fetchSearchResults(query)}
          className="px-6 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
        >
          🔄 Refresh Results
        </button>
      </div>
    </div>
  );
}

export default function AISearchResults() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-400 via-gray-200 to-white">
      <Suspense fallback={<div className="p-4 text-center text-gray-500">Loading…</div>}>
        <AISearchResultsInner />
      </Suspense>
    </div>
  );
}