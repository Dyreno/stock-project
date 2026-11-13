
"use client";

import { useEffect, useState, type FormEvent } from "react";

type Product = {
  id: number;
  sku: string;
  name: string;
  quantity: number;
};

type StockType = "IN" | "OUT";

export default function DashboardPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Add Product
  const [showForm, setShowForm] = useState(false);
  const [sku, setSku] = useState("");
  const [name, setName] = useState("");
  const [quantity, setQuantity] = useState(0);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  // Stock In / Stock Out
  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockType, setStockType] = useState<StockType>("IN");
  const [stockQuantity, setStockQuantity] = useState(1);
  const [stockNote, setStockNote] = useState("");
  const [stockSaving, setStockSaving] = useState(false);
  const [stockError, setStockError] = useState("");

  // GET Products
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

  // POST Add Product
  async function addProduct(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    setSaving(true);
    setFormError("");

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sku: sku.trim(),
          name: name.trim(),
          quantity,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add product");
      }

      setSku("");
      setName("");
      setQuantity(0);
      setShowForm(false);

      await fetchProducts();
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setSaving(false);
    }
  }

  // Open Stock Form
  function openStockForm(product: Product, type: StockType) {
    setStockProduct(product);
    setStockType(type);
    setStockQuantity(1);
    setStockNote("");
    setStockError("");
  }

  // POST Stock In / Stock Out
  async function submitStock(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!stockProduct) return;

    if (!Number.isInteger(stockQuantity) || stockQuantity <= 0) {
      setStockError("Quantity must be a positive whole number");
      return;
    }

    setStockSaving(true);
    setStockError("");

    try {
      const response = await fetch("/api/stock-transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          product_id: stockProduct.id,
          type: stockType,
          quantity: stockQuantity,
          note: stockNote,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update stock");
      }

      setStockProduct(null);
      await fetchProducts();
    } catch (error) {
      setStockError(
        error instanceof Error ? error.message : "Something went wrong"
      );
    } finally {
      setStockSaving(false);
    }
  }

  const totalStock = products.reduce(
    (sum, product) => sum + product.quantity,
    0
  );

  return (
    <main className="stock-dashboard min-h-screen bg-[#F5F6FA] p-8 text-gray-900">
      <div className="mx-auto max-w-6xl">
        <h1 className="mb-8 text-3xl font-bold">
          Stock Dashboard
        </h1>

        {/* Dashboard Summary */}
        <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="rounded-xl bg-gray-900 p-6">
            <p className="text-gray-400">Total Products</p>
            <h2 className="mt-2 text-3xl font-bold">
              {products.length}
            </h2>
          </div>

          <div className="rounded-xl bg-gray-900 p-6">
            <p className="text-gray-400">Total Stock</p>
            <h2 className="mt-2 text-3xl font-bold">
              {totalStock}
            </h2>
          </div>
        </div>

        {/* Products Section */}
        <div className="overflow-hidden rounded-xl bg-gray-900">
          <div className="flex flex-wrap items-center justify-between gap-4 p-6">
            <h2 className="text-xl font-semibold">
              Products
            </h2>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowForm(!showForm)}
                className="rounded-lg bg-green-600 px-4 py-2 hover:bg-green-700"
              >
                + Add Product
              </button>

              <button
                type="button"
                onClick={fetchProducts}
                className="rounded-lg bg-blue-600 px-4 py-2 hover:bg-blue-700"
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Add Product Form */}
          {showForm && (
            <div className="mx-6 mb-6 rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h2 className="mb-4 text-xl font-semibold">
                Add New Product
              </h2>

              <form onSubmit={addProduct} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    SKU
                  </label>

                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    required
                    placeholder="A2"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Product Name
                  </label>

                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    placeholder="Mouse"
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Quantity
                  </label>

                  <input
                    type="number"
                    value={quantity}
                    min="0"
                    step="1"
                    onChange={(e) => setQuantity(Number(e.target.value))}
                    required
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white"
                  />
                </div>

                {formError && (
                  <p className="text-sm text-red-400">
                    {formError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={saving}
                    className="rounded-lg bg-green-600 px-5 py-2 hover:bg-green-700 disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Save Product"}
                  </button>

                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setShowForm(false)}
                    className="rounded-lg bg-gray-700 px-5 py-2 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Stock In / Stock Out Form */}
          {stockProduct && (
            <div className="mx-6 mb-6 rounded-xl border border-gray-700 bg-gray-800 p-6">
              <h2 className="mb-2 text-xl font-semibold">
                {stockType === "IN" ? "Stock In" : "Stock Out"}
              </h2>

              <p className="mb-5 text-gray-400">
                Product: {stockProduct.name} | Current Stock:{" "}
                {stockProduct.quantity}
              </p>

              <form onSubmit={submitStock} className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Quantity
                  </label>

                  <input
                    type="number"
                    min="1"
                    max={
                      stockType === "OUT"
                        ? stockProduct.quantity
                        : undefined
                    }
                    step="1"
                    required
                    value={stockQuantity}
                    onChange={(e) =>
                      setStockQuantity(Number(e.target.value))
                    }
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm text-gray-400">
                    Note (Optional)
                  </label>

                  <textarea
                    value={stockNote}
                    onChange={(e) => setStockNote(e.target.value)}
                    placeholder="e.g. New shipment / Customer order"
                    rows={3}
                    className="w-full rounded-lg border border-gray-700 bg-gray-900 p-3 text-white"
                  />
                </div>

                {stockError && (
                  <p className="text-sm text-red-400">
                    {stockError}
                  </p>
                )}

                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={stockSaving}
                    className={`rounded-lg px-5 py-2 text-white disabled:opacity-50 ${
                      stockType === "IN"
                        ? "bg-green-600 hover:bg-green-700"
                        : "bg-red-600 hover:bg-red-700"
                    }`}
                  >
                    {stockSaving
                      ? "Saving..."
                      : stockType === "IN"
                        ? "Confirm Stock In"
                        : "Confirm Stock Out"}
                  </button>

                  <button
                    type="button"
                    disabled={stockSaving}
                    onClick={() => setStockProduct(null)}
                    className="rounded-lg bg-gray-700 px-5 py-2 hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Products Table */}
          {loading ? (
            <p className="p-6">Loading products...</p>
          ) : error ? (
            <p className="p-6 text-red-400">{error}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-800 text-gray-300">
                  <tr>
                    <th className="p-4">ID</th>
                    <th className="p-4">SKU</th>
                    <th className="p-4">Product Name</th>
                    <th className="p-4">Stock</th>
                    <th className="p-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {products.map((product) => (
                    <tr
                      key={product.id}
                      className="border-t border-gray-800 hover:bg-gray-800/50"
                    >
                      <td className="p-4">{product.id}</td>
                      <td className="p-4">{product.sku}</td>
                      <td className="p-4">{product.name}</td>
                      <td className="p-4">{product.quantity}</td>

                      <td className="p-4">
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              openStockForm(product, "IN")
                            }
                            className="rounded-lg bg-green-600 px-3 py-2 text-sm hover:bg-green-700"
                          >
                            Stock In
                          </button>

                          <button
                            type="button"
                            disabled={product.quantity === 0}
                            onClick={() =>
                              openStockForm(product, "OUT")
                            }
                            className="rounded-lg bg-red-600 px-3 py-2 text-sm hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Stock Out
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {products.length === 0 && (
                <p className="p-6 text-center text-gray-400">
                  No products found
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
