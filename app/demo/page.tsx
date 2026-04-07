"use client";

import Link from "next/link";

export default function DemoPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="text-2xl font-bold text-blue-600">LinguaLearn</div>
          <Link href="/dashboard">
            <button className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
              Open app
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <div>
            <h1 className="mb-6 text-4xl font-bold text-gray-900 md:text-5xl">
              Master Japanese & Chinese with Flashcards
            </h1>
            <p className="mb-8 text-xl text-gray-600">
              Interactive learning platform with multiple study modes. Learn at
              your own pace using spaced repetition and engaging study
              techniques.
            </p>
            <div className="flex gap-4">
              <Link href="/dashboard">
                <button className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white hover:bg-blue-700">
                  Start learning
                </button>
              </Link>
              <button className="rounded-lg border-2 border-blue-600 px-6 py-3 font-medium text-blue-600 hover:bg-blue-50">
                Learn More
              </button>
            </div>
          </div>
          <div className="rounded-lg bg-blue-500 p-12 text-center text-white">
            <h3 className="mb-4 text-2xl font-bold">
              Begin Your Language Journey Today
            </h3>
            <p className="text-lg opacity-90">
              Join thousands of learners mastering new languages
            </p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="mb-12 text-center text-3xl font-bold text-gray-900">
            Why Choose LinguaLearn?
          </h2>
          <div className="grid gap-8 md:grid-cols-4">
            {[
              {
                title: "Interactive Flashcards",
                desc: "Engaging visual learning",
              },
              {
                title: "Multiple Study Modes",
                desc: "Quiz, Match, Learn, Flashcard",
              },
              {
                title: "Progress Tracking",
                desc: "Track your learning journey",
              },
              { title: "Spaced Repetition", desc: "Optimize your learning" },
            ].map((feature, i) => (
              <div
                key={i}
                className="rounded-lg border border-gray-200 bg-gray-50 p-6"
              >
                <h3 className="mb-2 text-lg font-bold text-gray-900">
                  ✓ {feature.title}
                </h3>
                <p className="text-gray-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-600 py-20 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 text-center md:grid-cols-3">
            <div>
              <div className="mb-2 text-4xl font-bold">1000+</div>
              <div className="text-lg opacity-90">Active Learners</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold">500+</div>
              <div className="text-lg opacity-90">Study Sets</div>
            </div>
            <div>
              <div className="mb-2 text-4xl font-bold">4.9★</div>
              <div className="text-lg opacity-90">User Rating</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="mx-auto max-w-4xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="mb-6 text-3xl font-bold text-gray-900">
            Ready to Start Learning?
          </h2>
          <p className="mb-8 text-xl text-gray-600">
            Join thousands of learners and master a new language today.
          </p>
          <Link href="/dashboard">
            <button className="rounded-lg bg-blue-600 px-8 py-4 text-lg font-medium text-white hover:bg-blue-700">
              Go to dashboard
            </button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 py-8 text-white">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <p>&copy; 2026 LinguaLearn. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
