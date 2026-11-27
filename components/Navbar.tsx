
"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { usePathname } from "next/navigation";

export default function Navbar() {
    const { data: session, status } = useSession();
    const pathname = usePathname();

    return (
        <header className="w-full border-b border-gray-200 bg-white">
            <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
                {/* Website Name */}
                <Link href="/" className="text-xl font-bold text-gray-900">
                    Nattadon Stock
                </Link>

                {/* Navigation */}

                <nav className="flex items-center gap-8">
                    <Link
                        href="/"
                        className={`font-medium transition-colors ${pathname === "/"
                                ? "text-indigo-600"
                                : "text-gray-500 hover:text-indigo-600"
                            }`}
                    >
                        Dashboard
                    </Link>

                    <Link
                        href="/products"
                        className={`font-medium transition-colors ${pathname === "/products"
                                ? "text-indigo-600"
                                : "text-gray-500 hover:text-indigo-600"
                            }`}
                    >
                        Products
                    </Link>

                    <Link
                        href="/history"
                        className={`font-medium transition-colors ${pathname === "/history"
                                ? "text-indigo-600"
                                : "text-gray-500 hover:text-indigo-600"
                            }`}
                    >
                        History
                    </Link>
                </nav>


                {/* Discord Profile */}
                <div className="flex items-center gap-3">
                    {status === "loading" ? (
                        <span className="text-sm text-gray-400">Loading...</span>
                    ) : session?.user ? (
                        <>
                            {session.user.image ? (
                                <img
                                    src={session.user.image}
                                    alt="Discord Avatar"
                                    className="h-9 w-9 rounded-full object-cover"
                                />
                            ) : (
                                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                                    {session.user.name?.charAt(0) || "?"}
                                </div>
                            )}

                            <span className="text-sm font-medium text-gray-900">
                                {session.user.name || "Discord User"}
                            </span>
                        </>
                    ) : (
                        <Link
                            href="/login"
                            className="text-sm font-medium text-indigo-600"
                        >
                            Login
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
