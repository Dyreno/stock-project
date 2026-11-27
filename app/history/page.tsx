
"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState } from "react";
import { Search, RefreshCw, ListFilter, ChevronDown } from "lucide-react";


type StockTransaction = {
    id: number;
    product_id: number;
    type: "IN" | "OUT";
    quantity: number;
    note: string | null;
    discord_id: string | null;
    created_at: string;
    products: {
        id: number;
        sku: string;
        name: string;
    };
};

type ActivityLog = {
    id: number;
    discord_id: string;
    action: string;
    product_id: number | null;
    product_sku: string;
    product_name: string;
    details: {
        initial_quantity?: number;
        quantity_before_delete?: number;
    } | null;
    created_at: string;
};

type HistoryItem = {
    id: string;
    timestamp: string;
    date: string;
    action: string;
    sku: string;
    product: string;
    quantity: number | null;
    discordId: string | null;
    note: string | null;
};

export default function HistoryPage() {
    const [history, setHistory] = useState<HistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 20;
    const [search, setSearch] = useState("");
    const [actionFilter, setActionFilter] = useState("ALL");
    const filteredHistory = history.filter((item) => {
        const matchesSearch =
            item.product.toLowerCase().includes(search.toLowerCase()) ||
            item.sku.toLowerCase().includes(search.toLowerCase());

        const matchesAction =
            actionFilter === "ALL" ||
            item.action === actionFilter;

        return matchesSearch && matchesAction;
    });

    const totalPages = Math.max(
        1,
        Math.ceil(filteredHistory.length / itemsPerPage)
    );

    const safeCurrentPage = Math.min(currentPage, totalPages);

    const startIndex = (safeCurrentPage - 1) * itemsPerPage;

    const paginatedHistory = filteredHistory.slice(
        startIndex,
        startIndex + itemsPerPage
    );


    async function fetchHistory() {
        setLoading(true);
        setError("");

        try {
            const [stockRes, activityRes] = await Promise.all([
                fetch("/api/stock-transactions", {
                    cache: "no-store",
                }),
                fetch("/api/activity-logs", {
                    cache: "no-store",
                }),
            ]);

            if (!stockRes.ok || !activityRes.ok) {
                throw new Error("Failed to fetch history");
            }

            const stockData: StockTransaction[] =
                await stockRes.json();

            const activityData: ActivityLog[] =
                await activityRes.json();

            const stockHistory: HistoryItem[] = stockData.map(
                (item) => ({
                    id: `stock-${item.id}`,
                    timestamp: item.created_at,
                    date: item.created_at,
                    action:
                        item.type === "IN" ? "STOCK_IN" : "STOCK_OUT",
                    sku: item.products.sku,
                    product: item.products.name,
                    quantity:
                        item.type === "IN"
                            ? item.quantity
                            : -item.quantity,
                    discordId: item.discord_id,
                    note: item.note,
                })
            );

            const activityHistory: HistoryItem[] =
                activityData.map((item) => ({
                    id: `activity-${item.id}`,
                    timestamp: item.created_at,
                    date: item.created_at,
                    action: item.action,
                    sku: item.product_sku,
                    product: item.product_name,
                    quantity:
                        item.action === "CREATE_PRODUCT"
                            ? (item.details?.initial_quantity ?? null)
                            : null,
                    discordId: item.discord_id,
                    note: null,
                }));

            const combined = [
                ...stockHistory,
                ...activityHistory,
            ];

            // Parse Thai formatted date: DD/MM/YYYY, HH:mm:ss
            function parseThaiDate(value: string) {
                const [datePart, timePart = "00:00:00"] =
                    value.split(", ");

                const [day, month, year] =
                    datePart.split("/").map(Number);

                const [hour, minute, second] =
                    timePart.split(":").map(Number);

                return new Date(
                    year,
                    month - 1,
                    day,
                    hour,
                    minute,
                    second
                ).getTime();
            }

            combined.sort(
                (a, b) =>
                    parseThaiDate(b.timestamp) -
                    parseThaiDate(a.timestamp)
            );

            setHistory(combined);
        } catch (err) {
            console.error(err);
            setError("Failed to load history");
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchHistory();
    }, []);

    function getActionStyle(action: string) {
        switch (action) {
            case "CREATE_PRODUCT":
                return "bg-green-100 text-green-700";
            case "DELETE_PRODUCT":
                return "bg-red-100 text-red-700";
            case "STOCK_IN":
                return "bg-blue-100 text-blue-700";
            case "STOCK_OUT":
                return "bg-orange-100 text-orange-700";
            default:
                return "bg-gray-100 text-gray-700";
        }
    }

    function getActionLabel(action: string) {
        switch (action) {
            case "CREATE_PRODUCT":
                return "Add Product";
            case "DELETE_PRODUCT":
                return "Delete Product";
            case "STOCK_IN":
                return "Stock In";
            case "STOCK_OUT":
                return "Stock Out";
            default:
                return action;
        }
    }



    return (
        <div className="stock-dashboard min-h-screen bg-[#F5F6FA] text-gray-900">
            <Navbar />

            <main className="mx-auto max-w-7xl px-6 pt-8 pb-10">
                <div className="mb-8 flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            History
                        </h1>

                        <p className="mt-2 text-gray-500">
                            Product and stock activity history
                        </p>
                    </div>

                    <button
                        onClick={fetchHistory}
                        disabled={loading}
                        className="flex items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 shadow-sm transition-all hover:border-gray-300 hover:bg-gray-50 active:scale-95 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        <RefreshCw
                            size={16}
                            className={loading ? "animate-spin" : ""}
                        />

                        {loading ? "Refreshing..." : "Refresh"}
                    </button>
                </div>
                <div className="relative mb-4 w-full max-w-sm">
                    <Search
                        size={18}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />

                    <input
                        type="text"
                        placeholder="Search product or SKU..."
                        value={search}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-indigo-500"
                    />
                </div>
                <div className="relative mb-4 w-48 shrink-0">
                    <ListFilter
                        size={18}
                        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                    <select className="w-full appearance-none cursor-pointer rounded-lg border border-gray-200 bg-white py-2.5 pl-10 pr-10 text-sm text-gray-600 outline-none focus:border-indigo-500"
                        value={actionFilter}
                        onChange={(e) => {
                            setActionFilter(e.target.value);
                            setCurrentPage(1);
                        }}
                    >
                        <option value="ALL">ALL Actions</option>
                        <option value="STOCK_IN">Stock In</option>
                        <option value="STOCK_OUT">Stock Out</option>
                        <option value="CREATE_PRODUCT">Create Product</option>
                        <option value="DELETE_PRODUCT">Delete Product</option>
                    </select>

                    <ChevronDown
                        size={16}
                        className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                    />
                </div>
                {loading ? (
                    <p className="text-gray-500">Loading history...</p>
                ) : error ? (
                    <p className="text-red-600">{error}</p>
                ) : history.length === 0 ? (
                    <p className="text-gray-500">
                        No history found.
                    </p>
                ) : (
                    <>
                        {/* History Table */}
                        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white ยะขถ">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-gray-500">
                                        <tr>
                                            <th className="px-6 py-4">Date</th>
                                            <th className="px-6 py-4">Action</th>
                                            <th className="px-6 py-4">SKU</th>
                                            <th className="px-6 py-4">Product</th>
                                            <th className="px-6 py-4">Quantity</th>
                                            <th className="px-6 py-4">Discord ID</th>
                                            <th className="px-6 py-4">Note</th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {paginatedHistory.map((item) => (
                                            <tr
                                                key={item.id}
                                                className="border-t border-gray-100 hover:bg-gray-50"
                                            >
                                                <td className="whitespace-nowrap px-6 py-4 text-gray-500">
                                                    {item.date}
                                                </td>

                                                <td className="px-6 py-4">
                                                    <span
                                                        className={`inline-block whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold ${getActionStyle(item.action)}`}
                                                    >
                                                        {getActionLabel(item.action)}
                                                    </span>
                                                </td>

                                                <td className="px-6 py-4 text-gray-500">
                                                    {item.sku}
                                                </td>

                                                <td className="px-6 py-4 font-medium text-gray-900">
                                                    {item.product}
                                                </td>

                                                <td className="px-6 py-4">
                                                    {item.quantity === null
                                                        ? "—"
                                                        : item.quantity > 0
                                                            ? `+${item.quantity}`
                                                            : item.quantity}
                                                </td>

                                                <td className="px-6 py-4 font-mono text-xs text-gray-600">
                                                    {item.discordId ?? "Unknown"}
                                                </td>

                                                <td className="px-6 py-4 text-gray-500">
                                                    {item.note || "—"}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Pagination */}
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
                            <p className="text-sm text-gray-500">
                                Showing {startIndex + 1}–
                                {Math.min(
                                    startIndex + itemsPerPage,
                                    history.length
                                )}{" "}
                                of {history.length} entries
                            </p>

                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.max(1, page - 1)
                                        )
                                    }
                                    disabled={safeCurrentPage === 1}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Previous
                                </button>

                                <span className="text-sm text-gray-600">
                                    Page {safeCurrentPage} of {totalPages}
                                </span>

                                <button
                                    onClick={() =>
                                        setCurrentPage((page) =>
                                            Math.min(totalPages, page + 1)
                                        )
                                    }
                                    disabled={safeCurrentPage >= totalPages}
                                    className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-40"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </>
                )}
            </main>
        </div>
    );

}
