
"use client";

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

type StockTransaction = {
  id: number;
  type: "IN" | "OUT";
  quantity: number;
  created_at: string;
};

type ChartData = {
  date: string;
  stockIn: number;
  stockOut: number;
};

export default function StockMovementChart() {
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const response = await fetch("/api/stock-transactions");

        if (!response.ok) {
          throw new Error("Failed to fetch stock transactions");
        }

        const transactions: StockTransaction[] =
          await response.json();

        if (!Array.isArray(transactions)) {
          throw new Error("Invalid transaction data");
        }

        // Use Bangkok time for the 7-day period.
        const bangkokToday = new Intl.DateTimeFormat("en-CA", {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
        }).format(new Date());

        const [year, month, day] = bangkokToday
          .split("-")
          .map(Number);

        const todayUTC = Date.UTC(year, month - 1, day);

        // Create 7 dates, including today.
        const days: ChartData[] = Array.from(
          { length: 7 },
          (_, index) => {
            const date = new Date(
              todayUTC - (6 - index) * 86400000
            );

            return {
              date: date.toISOString().slice(0, 10),
              stockIn: 0,
              stockOut: 0,
            };
          }
        );

        // API dates are formatted as DD/MM/YYYY, HH:mm:ss.
        // Convert them into YYYY-MM-DD.
        transactions.forEach((transaction) => {
          const match = transaction.created_at.match(
            /^(\d{2})\/(\d{2})\/(\d{4})/
          );

          if (!match) return;

          const [, dd, mm, yyyy] = match;
          const transactionDate = `${yyyy}-${mm}-${dd}`;

          const dayData = days.find(
            (item) => item.date === transactionDate
          );

          if (!dayData) return;

          if (transaction.type === "IN") {
            dayData.stockIn += transaction.quantity;
          }

          if (transaction.type === "OUT") {
            dayData.stockOut += transaction.quantity;
          }
        });

        setChartData(days);
      } catch (err) {
        console.error(err);
        setError("Failed to load stock chart");
      } finally {
        setLoading(false);
      }
    }

    fetchTransactions();
  }, []);

  const displayData = chartData.map((item) => {
    const [, month, day] = item.date.split("-");

    return {
      ...item,
      label: `${day}/${month}`,
    };
  });

  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            Stock Movement
          </h2>
          <p className="text-sm text-gray-500">
            Stock In / Out over the last 7 days
          </p>
        </div>

        <span className="rounded-lg bg-gray-100 px-3 py-2 text-sm text-gray-600">
          Last 7 days
        </span>
      </div>

      {loading ? (
        <div className="flex h-72 items-center justify-center text-gray-500">
          Loading chart...
        </div>
      ) : error ? (
        <div className="flex h-72 items-center justify-center text-red-500">
          {error}
        </div>
      ) : (
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={displayData}
              margin={{
                top: 10,
                right: 20,
                left: 0,
                bottom: 5,
              }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                vertical={false}
                stroke="#E5E7EB"
              />

              <XAxis
                dataKey="label"
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              <YAxis
                allowDecimals={false}
                tick={{ fill: "#6B7280", fontSize: 12 }}
                tickLine={false}
                axisLine={false}
              />

              <Tooltip />

              <Legend />

              <Line
                type="monotone"
                dataKey="stockIn"
                name="Stock In"
                stroke="#4F46E5"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="stockOut"
                name="Stock Out"
                stroke="#0D9488"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
