"use client";

import Navbar from "@/components/Navbar";
import { useEffect, useState, type FormEvent } from "react";
import { Package, Boxes, TriangleAlert, PackageX } from "lucide-react";
import StockMovementChart from "@/components/StockMovementChart";
import RecentActivity from "@/components/RecentActivity";

type Product = {
  id: number;
  sku: string;
  name: string;
  quantity: number;
};


export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function fetchProducts() {
    try {
      setError("");

      const response = await fetch("/api/products", {
        cache: "no-store",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }

      const data: Product[] = await response.json();
      setProducts(data);
    } catch {
      setError("ไม่สามารถโหลดข้อมูลสินค้าได้");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchProducts();
  }, []);
  const totalProducts = products.length;
  const totalStock = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );
  const lowStock = products.filter((product) => product.quantity <= 5).length;
  const outStock = products.filter((product) => product.quantity === 0).length;
  const lowStockAlerts = products
    .filter((product) => product.quantity <= 5)
    .sort((a, b) => a.quantity - b.quantity)
    .slice(0, 5);
  
    
  return (
    <div className="stock-dashboard min-h-screen bg-[#F5F6FA] text-gray-900">
      <Navbar></Navbar>
      <main className="px-8 py-8">
        <div className="mx-auto max-w-6xl">
          <h1 className="text-3xl font-bold">
            Dashboard
          </h1>

          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4">
            <div className="rounded-xl bg-gray-900 p-6 ">
              <div className="flex justify-between">
                <p className="text-lg text-gray-500 text-[14px]">Total Products</p>
                <Package className="h-5 w-5 text-indigo-500" />
              </div>
              <h2 className="mt-2 text-3xl font-bold">{totalProducts}</h2>
            </div>
            <div className="rounded-xl bg-gray-900 p-6">
              <div className="flex justify-between">
                <p className="text-lg text-gray-500 text-[14px]">Total Stock</p>
                <Boxes className="h-5 w-5 text-blue-500" />
              </div>
              <h2 className="mt-2 text-3xl font-bold">{totalStock}</h2>
            </div>
            <div className="rounded-xl bg-gray-900 p-6 ">
              <div className="flex justify-between">
                <p className="text-lg text-gray-500 text-[14px]">Low Stock</p>
                <TriangleAlert className="h-5 w-5 text-orange-500" />
              </div>
              <h2 className="mt-2 text-3xl font-bold">{lowStock}</h2>
            </div>
            <div className="rounded-xl bg-gray-900 p-6 ">
              <div className="flex justify-between">
                <p className="text-lg text-gray-400 text-[14px]">Out of Stock</p>
                <PackageX className="h-5 w-5 text-red-500" />
              </div>
              <h2 className="mt-2 text-3xl font-bold">{outStock}</h2>
            </div>
          </div>
          <div className="mt-6">
            <StockMovementChart />
          </div>
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 pt-4">
            <div className="rounded-xl bg-gray-900 p-6 min-h-[400px] shadow-sm">
              <p className="text-lg text-[18px] font-semibold">Low Stock Alerts</p>
              <div className="flex flex-col justify-center gap-6 h-full">
                {lowStockAlerts.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between"
                  >
                    <span className="text-gray-400 text-[14px]">
                      {product.name}
                    </span>

                    <span
                      className={`flex h-10 w-10 items-center justify-center rounded-full font-semibold ${product.quantity === 0
                        ? "bg-red-100 text-red-600"
                        : "bg-orange-100 text-orange-700"
                        }`}
                    >
                      {product.quantity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
              <RecentActivity />
          </div>
        </div>
      </main >
    </div >
  );
}
