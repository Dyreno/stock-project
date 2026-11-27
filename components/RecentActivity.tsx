"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownLeft, ArrowUpRight, Plus, Trash2 } from "lucide-react";

type Activity = {
  id: string;
  action: string;
  product: string;
  sku: string;
  quantity: number | null;
  createdAt: string;
};

type ApiRecord = {
  id: number | string;
  type?: string;
  action?: string;
  quantity?: number | null;
  product_name?: string;
  product_sku?: string;
  products?: {
    name: string;
    sku: string;
  } | null;
  created_at?: string;
};

export default function RecentActivity() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchActivities() {
      try {
        const [stockRes, logsRes] = await Promise.all([
          fetch("/api/stock-transactions"),
          fetch("/api/activity-logs"),
        ]);

        if (!stockRes.ok || !logsRes.ok) {
          throw new Error("Failed to fetch activities");
        }

        const stockData: ApiRecord[] = await stockRes.json();
        const logsData: ApiRecord[] = await logsRes.json();

        // Stock In / Stock Out
        const stockActivities: Activity[] = stockData.map((item) => ({
          id: `stock-${item.id}`,
          action: item.type === "IN" ? "Stock In" : "Stock Out",
          product: item.products?.name ?? item.product_name ?? "Unknown",
          sku: item.products?.sku ?? item.product_sku ?? "—",
          quantity:
            item.type === "OUT"
              ? -(item.quantity ?? 0)
              : (item.quantity ?? 0),
          createdAt: item.created_at ?? "",
        }));

        // Create / Delete Product
        const productActivities: Activity[] = logsData.map((item) => ({
          id: `log-${item.id}`,
          action:
            item.action === "CREATE_PRODUCT"
              ? "Product Created"
              : "Product Deleted",
          product: item.product_name ?? "Unknown",
          sku: item.product_sku ?? "—",
          quantity: null,
          createdAt: item.created_at ?? "",
        }));

        const combined = [
          ...stockActivities,
          ...productActivities,
        ];

        // รองรับวันที่ ISO และ DD/MM/YYYY, HH:mm:ss
        function getTimestamp(dateString: string) {
          const match = dateString.match(
            /^(\d{2})\/(\d{2})\/(\d{4}),?\s+(\d{2}):(\d{2})(?::(\d{2}))?/
          );

          if (match) {
            const [, day, month, year, hour, minute, second] = match;
            return Date.UTC(
              Number(year),
              Number(month) - 1,
              Number(day),
              Number(hour),
              Number(minute),
              Number(second ?? 0)
            );
          }

          return new Date(dateString).getTime() || 0;
        }

        combined.sort(
          (a, b) =>
            getTimestamp(b.createdAt) -
            getTimestamp(a.createdAt)
        );

        setActivities(combined.slice(0, 5));
      } catch (error) {
        console.error("Recent activity error:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchActivities();
  }, []);

  function getActivityIcon(action: string) {
    switch (action) {
      case "Stock In":
        return <ArrowDownLeft size={20} className="text-green-600" />;
      case "Stock Out":
        return <ArrowUpRight size={20} className="text-red-600" />;
      case "Product Created":
        return <Plus size={20} className="text-indigo-600" />;
      case "Product Deleted":
        return <Trash2 size={20} className="text-gray-600" />;
      default:
        return null;
    }
  }

  return (
    <div className="rounded-xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">
          Recent Activity
        </h2>

        <Link
          href="/history"
          className="text-sm font-medium text-indigo-600 hover:text-indigo-700"
        >
          View all
        </Link>
      </div>

      {loading ? (
        <p className="text-sm text-gray-500">Loading activities...</p>
      ) : activities.length === 0 ? (
        <p className="text-sm text-gray-500">No recent activity.</p>
      ) : (
        <div className="space-y-4">
          {activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center gap-3 border-b border-gray-100 pb-4 last:border-b-0 last:pb-0"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gray-50">
                {getActivityIcon(activity.action)}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-gray-900">
                  {activity.product}
                </p>

                <p className="text-xs text-gray-500">
                  {activity.action} · {activity.sku}
                </p>
              </div>

              <div className="shrink-0 text-right">
                {activity.quantity !== null && (
                  <p
                    className={`text-sm font-semibold ${
                      activity.quantity > 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {activity.quantity > 0 ? "+" : ""}
                    {activity.quantity}
                  </p>
                )}

                <p className="text-xs text-gray-400">
                  {activity.createdAt}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}