import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-xl">📊</span>
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Vision Note</h1>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/sign-in"
              className="text-gray-700 font-medium hover:text-gray-900 transition-colors"
            >
              Login
            </Link>
            <Link
              href="/sign-up"
              className="px-6 py-2.5 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all"
            >
              Sign up
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-8 py-20">
        <div className="max-w-3xl">
          <div className="inline-block px-4 py-1.5 bg-blue-50 text-blue-700 rounded-full text-sm font-medium mb-6">
            VISION NOTE
          </div>
          <h1 className="text-6xl font-bold text-gray-900 mb-6 leading-tight">
            Annotate and manage vision data 📝 efficiently
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl">
            Build your vision datasets by viewing images and adding detailed annotations. Simple, fast, and efficient annotation workflow.
          </p>
          <div className="flex gap-4">
            <Link
              href="/sign-up"
              className="px-8 py-4 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-all shadow-sm"
            >
              Get Started
            </Link>
            <Link
              href="/sign-in"
              className="px-8 py-4 bg-white border border-gray-300 text-gray-700 rounded-full font-medium hover:bg-gray-50 transition-all"
            >
              Login
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
