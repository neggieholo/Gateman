/* eslint-disable @next/next/no-img-element */
"use client";

import { CalendarDays, CheckCircle2, Wrench } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

const modules = [
  {
    number: "01",
    title: "Visitor management",
    description:
      "Digitise every stage of the visitor journey, from pre-registration to check-in and visitor history.",
    features: [
      "Visitor pre-registration",
      "QR codes and one-time PINs",
      "Digital check-in and host notifications",
      "Visitor history and analytics",
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <rect x="3" y="3" width="18" height="18" rx="4" />
        <path d="M8 8h3v3H8zM15 8h1M8 15h1M14 14h3v3h-3zM14 8v3M8 12v1M12 15h1" />
      </svg>
    ),
  },
  {
    number: "02",
    title: "Resident & tenant management",
    description:
      "Keep resident information, household records, guest approvals and digital access permissions in one place.",
    features: [
      "Resident profiles and directories",
      "Household management",
      "Guest approval workflows",
      "Digital access permissions",
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
        <circle cx="9" cy="7" r="4" />
        <path d="M20 8v6M17 11h6" />
      </svg>
    ),
  },
  {
    number: "03",
    title: "Security operations",
    description:
      "Give security teams digital tools to coordinate duties, monitor attendance and maintain accountable records.",
    features: [
      "Guard scheduling and shift planning",
      "Attendance and duty assignments",
      "Digital occurrence book",
      "Incident reports and shift handovers",
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M12 22s8-4 8-11V5l-8-3-8 3v6c0 7 8 11 8 11Z" />
        <path d="m9 12 2 2 4-4" />
      </svg>
    ),
  },
  {
    number: "04",
    title: "Estate & facility management",
    description:
      "Bring everyday property operations into a more organised, visible and accountable digital workflow.",
    features: [
      "Contractor and vendor authorisation",
      "Delivery management",
      "Community announcements",
      "Digital reports and audit logs",
    ],
    icon: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.7"
      >
        <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6M9 9h.01M15 9h.01M9 12h.01M15 12h.01" />
      </svg>
    ),
  },
];

const audiences = [
  {
    title: "Residential estates",
    text: "Manage people and access across residential communities.",
    icon: "⌂",
  },
  {
    title: "Gated communities",
    text: "Coordinate visitor access and on-site security workflows.",
    icon: "◈",
  },
  {
    title: "Corporate offices",
    text: "Create a more organised approach to workplace access.",
    icon: "▤",
  },
  {
    title: "Property managers",
    text: "Improve visibility across properties and daily operations.",
    icon: "▦",
  },
  {
    title: "Commercial buildings",
    text: "Manage visitors, vendors and deliveries in one workflow.",
    icon: "⌘",
  },
  {
    title: "Facility operators",
    text: "Keep operational records, reports and activity organised.",
    icon: "◎",
  },
];

// function Brand({ light = false }: { light?: boolean }) {
//   return (
//     <a href="#home" className="flex shrink-0 items-center gap-2.5">
//       <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-gm-gold text-gm-navy">
//         <svg viewBox="0 0 32 32" fill="none" className="h-7 w-7">
//           <path
//             d="M16 3 27 8v8c0 7-4.6 11.1-11 14C9.6 27.1 5 23 5 16V8l11-5Z"
//             stroke="currentColor"
//             strokeWidth="2.2"
//             strokeLinejoin="round"
//           />
//           <path
//             d="M11 16.5 14.5 20 22 12.5"
//             stroke="currentColor"
//             strokeWidth="2.4"
//             strokeLinecap="round"
//             strokeLinejoin="round"
//           />
//         </svg>
//       </span>
//       <span
//         className={`text-xl font-extrabold tracking-tight ${light ? "text-white" : "text-gm-navy"}`}
//       >
//         GateMan<span className="text-gm-gold">.</span>
//       </span>
//     </a>
//   );
// }

function ArrowIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4">
      <path
        d="M4 10h12m-5-5 5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="none" className="h-4 w-4 shrink-0">
      <path
        d="m4 10 4 4 8-8"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export default function Home() {
  const [email, setEmail] = useState("");
  const router = useRouter();

  return (
    <main className="min-h-screen overflow-hidden bg-[#FFFFFF] text-[#1C1C1E]">
      {/* Navigation */}
      <nav className="sticky top-0 z-20 mx-auto flex max-w-7xl items-center justify-between px-6 py-5 lg:px-10">
        <div className="flex items-center">
          <img
            src="/gm_landing_logo.jpg"
            alt="GateMan Logo"
            className="h-12 w-20"
          />
          <div className="flex h-full items-center">
            <img
              src="/gmlanding_2.jpg"
              alt="GateMan Logo"
              className="h-8 w-40"
            />
          </div>
        </div>

        <div className="hidden items-center gap-6 text-sm font-oswald font-medium text-gray-600 lg:flex">
          <Link href="#platform" className="transition hover:text-gm-navy">
            Platform
          </Link>
          <Link href="#who-we-serve" className="transition hover:text-gm-navy">
            Solutions
          </Link>
          <Link href="#how-it-works" className="transition hover:text-gm-navy">
            How it works
          </Link>
          <Link href="#security" className="transition hover:text-gm-navy">
            Security
          </Link>
          <Link href="#community" className="transition hover:text-gm-navy">
            Community
          </Link>
          <Link href="#about" className="transition hover:text-gm-navy">
            About
          </Link>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="hidden rounded-full bg-gm-navy px-6 py-3 text-sm font-oswald font-semibold text-white transition hover:bg-[#142E59] md:inline-flex"
        >
          Sign Up/Login <span className="ml-2">↗</span>
        </button>
      </nav>

      {/* Hero */}
      <section className="relative mx-auto grid max-w-7xl items-center gap-14 px-6 pt-12 lg:grid-cols-2 lg:px-10 lg:pt-20">
        <div className="absolute -left-32 top-20 z-0 h-80 w-80 rounded-full bg-gm-gold/30 blur-3xl" />

        <div className="relative z-10">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-gm-navy/10 bg-white px-4 py-2 text-xs font-sans font-semibold text-gm-navy shadow-sm">
            <span className="h-2 w-2 animate-pulse rounded-full bg-gm-gold" />A
            smarter way to manage estate access, community and security
            operations.
          </div>

          <h1 className="max-w-2xl text-5xl font-montserrat font-semibold leading-[1.06] tracking-[-0.055em] sm:text-6xl lg:text-7xl">
            Your estate.
            <br />
            Your people.
            <br />
            <span className="relative inline-block text-gm-gold">
              Your security.
              <svg
                className="absolute -bottom-3 left-0 w-full"
                viewBox="0 0 330 14"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M3 9C80 2 225 1 326 7"
                  stroke="#D4AF37"
                  strokeWidth="6"
                  strokeLinecap="round"
                />
              </svg>
            </span>
          </h1>

          <p className="mt-8 max-w-lg text-lg leading-8 text-gray-600 italic font-montserrat">
            Simplify visitor access, empower residents, and give your security
            team the tools to manage every arrival with confidence.
          </p>
          <p className="mt-7 max-w-xl font-montserrat text-base leading-7 text-slate-600 sm:text-lg sm:leading-8">
            GateMan brings visitor management, resident access and security
            operations together in one cloud-based platform—helping property
            managers and security teams work with greater visibility and
            accountability.
          </p>

          <div className="mt-9 flex flex-col gap-3 sm:flex-row font-oswald">
            <button
              onClick={() => router.push("/login")}
              className="inline-flex items-center justify-center rounded-full bg-gm-navy px-7 py-4 font-semibold text-white shadow-lg shadow-gm-navy/10 transition hover:-translate-y-0.5 hover:bg-[#142E59]"
            >
              Discover GateMan <span className="ml-3 text-xl">↗</span>
            </button>
            <a
              href="#how-it-works"
              className="inline-flex items-center justify-center rounded-full border border-gray-300 bg-white px-7 py-4 font-semibold transition hover:border-gm-navy"
            >
              Learn More <span className="ml-3">↓</span>
            </a>
          </div>
        </div>

        {/* Dashboard illustration — GateMan Command Center */}
        <div className="relative z-10 mx-auto w-full max-w-4xl lg:ml-auto">
          <div className="absolute -right-8 -top-8 h-40 w-40 rounded-full bg-gm-gold/60 blur-3xl" />
          <div className="absolute -bottom-8 -left-8 h-40 w-40 rounded-full bg-blue-200/50 blur-3xl" />

          <div className="relative overflow-hidden rounded-2xl border border-slate-200 shadow-2xl shadow-slate-950/15 transition-all duration-500 hover:scale-[0.98] hover:shadow-xl sm:rounded-3xl bg-black">
            <div className="flex">
              {/* Sidebar */}
              <aside className="hidden w-24 shrink-0 flex-col items-center bg-gm-navy px-2 py-4 sm:flex sm:w-28">
                <div className="flex h-7 w-10 items-center justify-center border-2 border-white bg-white text-sm font-black tracking-tighter text-gm-navy">
                  <img src="gmlogo.jpg" className="h-6 w-full" alt="gm_logo" />
                </div>

                <div className="mt-4 flex w-full flex-col gap-1">
                  {[
                    { label: "Home", icon: "⌂", active: true },
                    { label: "Payments", icon: "▤" },
                    { label: "Security", icon: "⬡" },
                    { label: "Community", icon: "▱" },
                    { label: "Bookings", icon: "▦" },
                    { label: "Residents", icon: "♙" },
                    { label: "Services", icon: "▧" },
                    { label: "Users", icon: "♧" },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-[7.5px] font-bold ${
                        item.active ? "bg-white text-gm-navy" : "text-slate-200"
                      }`}
                    >
                      <span className="text-[11px]">{item.icon}</span>
                      <span>{item.label}</span>
                      {item.active && (
                        <span className="ml-auto h-1 w-1 rounded-full bg-gm-navy" />
                      )}
                    </div>
                  ))}
                </div>

                <div className="mt-auto w-full border-t border-white/20 pt-2.5">
                  <div className="truncate text-[7.5px] font-bold text-white">
                    Estate Admin
                  </div>
                  <div className="mt-0.5 inline-flex rounded-full bg-gm-navy px-1.5 py-0.2 text-[6.5px] font-black text-gm-navy">
                    ADMIN
                  </div>
                </div>
              </aside>

              {/* Dashboard content */}
              <div className="min-w-0 flex-1 bg-[#f7f9fc]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 bg-white px-2.5 py-2.5 sm:px-3.5 sm:py-3">
                  <div className="min-w-0">
                    <p className="truncate text-[11px] font-black tracking-tight text-gm-navy sm:text-sm">
                      Welcome, Example Estate
                    </p>
                    <p className="text-[7.5px] text-slate-400 sm:text-[8.5px]">
                      Estate management dashboard
                    </p>
                  </div>

                  <div className="ml-2 flex shrink-0 items-center gap-1">
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg border border-slate-100 bg-white text-[10px] text-slate-600">
                      ♧
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center rounded-lg border border-slate-100 bg-white text-[10px] text-slate-600">
                      ⚙
                    </div>
                  </div>
                </div>

                <div className="space-y-2 p-2 sm:space-y-2.5 sm:p-2.5">
                  <h3 className="text-xs font-black tracking-tight text-gm-navy sm:text-sm">
                    Command Center
                  </h3>

                  {/* Primary statistics */}
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      {
                        label: "Security",
                        value: "12",
                        icon: "♢",
                        iconBg: "bg-indigo-50 text-indigo-600",
                        metrics: [
                          ["On-duty", "8", "text-gm-navy"],
                          ["Unresolved complaints", "2", "text-rose-500"],
                          ["Join requests", "3", "text-rose-500"],
                        ],
                      },
                      {
                        label: "Community Board",
                        value: "8",
                        icon: "♧",
                        iconBg: "bg-rose-50 text-rose-600",
                        metrics: [["Unread posts", "4", "text-rose-500"]],
                      },
                      {
                        label: "Payments This Month",
                        value: "24",
                        icon: "▤",
                        iconBg: "bg-amber-50 text-amber-600",
                        metrics: [
                          ["Total pending", "5", "text-amber-600"],
                          ["Payment reports", "1", "text-slate-500"],
                        ],
                      },
                      {
                        label: "Events",
                        value: "6",
                        icon: "▦",
                        iconBg: "bg-purple-50 text-purple-600",
                        metrics: [
                          ["Upcoming", "3", "text-purple-600"],
                          ["Pending", "2", "text-amber-500"],
                          ["Payment pending", "1", "text-amber-500"],
                        ],
                      },
                    ].map((card) => (
                      <div
                        key={card.label}
                        className="flex flex-col justify-between rounded-xl border border-slate-100 bg-white p-2 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-md sm:p-2.5"
                      >
                        <div>
                          <div className="mb-1 flex items-center justify-between gap-1">
                            <div
                              className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md text-[10px] sm:h-6 sm:w-6 ${card.iconBg}`}
                            >
                              {card.icon}
                            </div>

                            <span className="text-right text-[6.5px] font-bold uppercase tracking-wide text-slate-400 sm:text-[7.5px]">
                              {card.label}
                            </span>
                          </div>

                          <p className="text-base font-black tracking-tight text-gm-navy sm:text-lg">
                            {card.value}
                          </p>
                        </div>

                        <div className="mt-1.5 space-y-0.5 border-t border-slate-100 pt-1">
                          {card.metrics.map(([label, value, color]) => (
                            <div
                              key={label}
                              className="flex items-center justify-between gap-1"
                            >
                              <span className="truncate text-[6.5px] font-bold uppercase text-slate-400 sm:text-[7.5px]">
                                {label}
                              </span>
                              <span
                                className={`shrink-0 text-[7.5px] font-bold ${color}`}
                              >
                                {value}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resident Management and Services */}
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {/* Resident Management */}
                    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                      <div className="flex items-start gap-2 border-b border-slate-100 bg-linear-to-r from-white to-blue-50/70 p-2 sm:p-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-blue-600 text-xs text-white shadow-sm">
                          ♙
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-gm-navy sm:text-xs">
                            Resident Management
                          </p>
                          <p className="text-[7px] font-bold uppercase text-slate-400">
                            Tenants: <span className="text-slate-800">128</span>
                          </p>
                          <p className="text-[7px] font-bold uppercase text-slate-400">
                            Reports: <span className="text-rose-500">3</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-2 sm:p-2.5">
                        <p className="mb-1 text-[7px] font-bold uppercase tracking-wider text-slate-400">
                          ⊕ Pending Requests
                        </p>
                        <div className="inline-flex min-w-12 items-center rounded-lg border border-slate-100 px-2 py-1">
                          <span className="text-sm font-black text-gm-navy">
                            5
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Services Requests */}
                    <div className="overflow-hidden rounded-xl border border-slate-100 bg-white shadow-sm transition-all duration-300 hover:shadow-md">
                      <div className="flex items-start gap-2 border-b border-slate-100 bg-gradient-to-r from-white to-gm-navy/5 p-2 sm:p-2.5">
                        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gm-navy text-xs text-white shadow-sm">
                          ⚒
                        </div>

                        <div className="min-w-0">
                          <p className="text-[10px] font-black text-gm-navy sm:text-xs">
                            Services Requests
                          </p>
                          <p className="text-[7px] font-bold uppercase text-slate-400">
                            Total: <span className="text-slate-800">16</span> |
                            Pending: <span className="text-amber-500">4</span>
                          </p>
                          <p className="text-[7px] font-bold uppercase text-slate-400">
                            Dispatched:{" "}
                            <span className="text-indigo-600">9</span>
                          </p>
                        </div>
                      </div>

                      <div className="p-2 sm:p-2.5">
                        <p className="mb-1 text-[7px] font-bold uppercase tracking-wider text-slate-400">
                          ⊕ Recently Completed
                        </p>
                        <div className="inline-flex min-w-12 items-center rounded-lg border border-slate-100 px-2 py-1">
                          <span className="text-sm font-black text-gm-navy">
                            9
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Dashboard footer */}
                  <div className="flex items-center justify-between rounded-lg border border-slate-100 bg-white px-2.5 py-2">
                    <div>
                      <p className="text-[7.5px] font-bold text-gm-navy">
                        GateMan Security Operations
                      </p>
                      <p className="text-[7px] text-slate-400">
                        Estate activity at a glance
                      </p>
                    </div>

                    <div className="flex items-center gap-1 rounded-full bg-gm-navy/5 px-2 py-1 text-[6.5px] font-bold text-gm-navy">
                      <span className="h-1 w-1 rounded-full bg-gm-navy" />
                      Dashboard preview
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating security status */}
          <div className="absolute -bottom-3 -left-2 hidden items-center gap-2.5 rounded-xl border border-white bg-white px-3 py-2 shadow-xl sm:flex lg:-left-5">
            <div className="flex h-7 w-7 items-center justify-center rounded-full bg-gm-navy/5 text-sm text-gm-navy">
              ✓
            </div>

            <div>
              <p className="text-[11px] font-bold text-slate-900">
                Estate operations
              </p>
              <p className="text-[8.5px] text-slate-500">
                Security, residents and services
              </p>
            </div>
          </div>

          {/* Floating access status */}
          <div className="absolute -right-2 top-14 hidden items-center gap-2 rounded-xl border border-white bg-white px-2.5 py-2 shadow-xl md:flex lg:-right-4">
            <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-gm-gold/10 text-xs text-gm-navy">
              ⌘
            </div>

            <div>
              <p className="text-[8.5px] font-bold text-slate-900">
                Access management
              </p>
              <p className="text-[7.5px] text-slate-500">
                One connected platform
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Positioning strip */}
      <section className="border-y border-slate-100 bg-white mt-2">
        <div className="mx-auto flex max-w-7xl flex-col font-sans gap-5 px-5 py-7 sm:px-8 md:flex-row md:items-center md:justify-between lg:px-12">
          <p className="max-w-md text-sm leading-6 text-slate-600">
            Built for the people responsible for managing{" "}
            <span className="font-bold text-gm-navy">
              properties, access and daily operations.
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {[
              "Estates",
              "Residential communities",
              "Commercial properties",
              "Facility teams",
            ].map((label) => (
              <span
                key={label}
                className="rounded-full border border-slate-200 px-3.5 py-2 text-xs font-sans oswald font-semibold text-slate-600"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Platform modules */}
      <section
        id="platform"
        className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 lg:px-12 bg-gm-navy/30"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-montserrat font-extrabold uppercase tracking-[0.2em] text-gm-navy">
              The GateMan platform
            </p>
            <h2 className="mt-4 text-3xl font-montserrat font-extrabold leading-tight tracking-[-0.035em] text-gm-navy sm:text-4xl lg:text-5xl">
              More than visitor management.
            </h2>
            <p className="mt-5 text-base font-montserrat leading-7 text-slate-600 sm:text-lg">
              A connected approach to managing the people, permissions and
              processes that keep properties running.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:mt-16 lg:grid-cols-4">
            {modules.map((module) => (
              <article
                key={module.number}
                className="group flex h-full flex-col rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-gm-gold hover:shadow-xl hover:shadow-gm-navy/5 sm:p-7"
              >
                <div className="flex items-center justify-between">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gm-gold/10 text-gm-navy transition group-hover:bg-gm-gold">
                    <span className="h-6 w-6">{module.icon}</span>
                  </span>
                  <span className="text-xs font-bold tracking-widest text-gm-navy">
                    {module.number}
                  </span>
                </div>
                <h3 className="mt-7 text-xl font-oswald font-extrabold tracking-tight text-gm-navy">
                  {module.title}
                </h3>
                <p className="mt-3 text-sm leading-6 font-sans text-slate-600">
                  {module.description}
                </p>
                <ul className="mt-6 space-y-3 border-t border-slate-100 pt-5">
                  {module.features.map((feature) => (
                    <li
                      key={feature}
                      className="flex items-start gap-2.5 text-xs leading-5 font-sans text-slate-600"
                    >
                      <span className="mt-0.5 text-gm-navy">
                        <CheckIcon />
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-y border-gray-200/80 bg-white/70">
        <div className="mx-auto max-w-7xl flex justify-evenly gap-6 px-6 py-4 lg:px-10">
          {[
            ["01", "Digital visitor passes"],
            ["02", "Resident access"],
            ["03", "Security Tracking and Monitoring"],
            ["06", "Community Engagement"],
          ].map(([number, label]) => (
            <div
              key={number}
              className="flex items-center justify-center gap-3 font-montserrat"
            >
              <span className="text-md font-bold text-gray-600">{number}</span>
              <span className="text-sm font-semibold text-gm-navy sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>
      <section className="border-y border-gray-200/80 bg-gm-navy">
        <div className="mx-auto max-w-7xl flex justify-evenly gap-6 px-6 py-4 lg:px-10">
          {[
            ["05", "Centralised records"],
            ["07", "Reports and Suggestions"],
            ["08", "Service Requests and Dispatch"],
            ["04", "Facility Access management"],
          ].map(([number, label]) => (
            <div
              key={number}
              className="flex items-center justify-center gap-3 font-montserrat"
            >
              <span className="text-md font-bold text-black">{number}</span>
              <span className="text-sm font-semibold text-white sm:text-sm">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section
        id="how-it-works"
        className="scroll-mt-20 bg-white px-6 py-20 lg:px-10 lg:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-xs font-montserrat font-bold uppercase tracking-[0.22em] text-gm-navy">
              How GateMan works
            </p>
            <h2 className="mt-4 text-3xl font-montserrat font-extrabold leading-tight tracking-[-0.035em] text-gm-navy sm:text-4xl lg:text-5xl">
              One platform for more organised property operations.
            </h2>
            <p className="mt-5 text-base font-montserrat leading-7 text-slate-600 sm:text-lg">
              Bring your property, people and day-to-day workflows together in
              four straightforward stages.
            </p>
          </div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                number: "01",
                title: "Set up your property",
                description:
                  "Create your property workspace and organise the information your administrators need to manage operations.",
              },
              {
                number: "02",
                title: "Connect your people",
                description:
                  "Bring residents, administrators and security personnel into a more connected access and communication process.",
              },
              {
                number: "03",
                title: "Coordinate daily operations",
                description:
                  "Manage visitor access, security activities, facility bookings and service requests through connected workflows.",
              },
              {
                number: "04",
                title: "Maintain visibility",
                description:
                  "Keep track of activity, records, reports and community updates to support more accountable operations.",
              },
            ].map((step) => (
              <article
                key={step.number}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition duration-300 hover:-translate-y-1 hover:border-gm-gold hover:shadow-xl hover:shadow-gm-navy/5 sm:p-7"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gm-gold/10 text-sm font-bold text-gm-navy">
                  {step.number}
                </span>
                <h3 className="mt-6 text-xl font-oswald font-extrabold tracking-tight text-gm-navy">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm font-sans leading-6 text-slate-600">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="security" className="bg-gm-navy text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-14 px-6 py-20 lg:grid-cols-2 lg:px-10 lg:py-28">
          <div>
            <p className="text-xs font-montserrat font-bold uppercase tracking-[0.22em] text-gm-gold">
              Advanced security & accountability
            </p>
            <h2 className="mt-5 text-4xl font-montserrat font-semibold leading-tight tracking-tight sm:text-5xl">
              Track every movement
              <br />
              from check-in
              <br />
              to checkout.
            </h2>
            <p className="mt-6 max-w-lg leading-7 font-montserrat text-white">
              Empower your estate with end-to-end security visibility. Monitor
              guard tours, enforce location-based liveness verification, and
              maintain a tamper-proof audit trail of all actions.
            </p>

            <div className="mt-10 space-y-6">
              {[
                [
                  "1",
                  "Check-in & Checkout",
                  "Track precise entry and exit timestamps for visitors, staff, and contractors in real-time.",
                ],
                [
                  "2",
                  "Liveness & Location Proof",
                  "Guards and personnel can be requested to capture liveness-verified photos locked to their exact duty spot.",
                ],
                [
                  "3",
                  "Schedules & Audits",
                  "Seamlessly align with shift schedules while every security action is logged.",
                ],
              ].map(([number, title, description]) => (
                <div key={number} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/20 bg-white/10 font-bold text-gm-gold">
                    {number}
                  </div>
                  <div>
                    <h3 className="font-oswald font-bold">{title}</h3>
                    <p className="mt-1 text-sm leading-6 font-sans text-gm-navy/70">
                      {description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guard Map Location Visual matching live app */}
          <div className="relative mx-auto w-full max-w-md">
            <div className="absolute -inset-8 rounded-full bg-gm-gold/10 blur-3xl" />
            <div className="relative rounded-4xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl backdrop-blur-sm sm:p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-gm-navy/60">
                    LIVE RADAR & MAP
                  </p>
                  <p className="mt-2 text-xl font-bold">
                    Personnel Geolocation
                  </p>
                </div>
                <span className="flex items-center gap-1.5 rounded-full bg-gm-gold px-3 py-1.5 text-[10px] font-bold text-gm-navy">
                  <span className="h-1.5 w-1.5 rounded-full bg-gm-navy animate-pulse" />
                  TRACKING ACTIVE
                </span>
              </div>

              <div className="mt-7 rounded-2xl bg-white p-5 text-gray-900 shadow-inner">
                <div className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gm-navy text-base font-bold text-gm-gold shadow-md">
                      🛡️
                    </div>
                    <div>
                      <p className="font-bold text-sm">John Guard (On Duty)</p>
                      {/* Coordinates up top with actual address underneath */}
                      <p className="text-[11px] font-mono text-gm-gold font-bold">
                        Lat: 6.5244° N, Lon: 3.3392° E
                      </p>
                      <p className="text-[10px] text-gray-500 font-medium">
                        Example Estate, Main Gate
                      </p>
                    </div>
                  </div>
                  <span className="rounded-lg bg-gm-navy/5 px-2.5 py-1 text-[10px] font-bold text-gm-navy border border-gm-navy/15">
                    Verified
                  </span>
                </div>

                {/* Simulated Map Visual Box */}
                <div className="relative mt-4 h-40 w-full overflow-hidden rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center">
                  <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:1.5rem_1.5rem] opacity-40" />

                  <div className="absolute h-28 w-28 rounded-full border border-gm-gold/20 animate-ping" />
                  <div className="absolute h-16 w-16 rounded-full border border-gm-gold/40" />

                  <div className="relative z-10 flex flex-col items-center">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gm-gold text-gm-navy font-black shadow-lg shadow-gm-gold/30 border-2 border-white animate-bounce">
                      📍
                    </div>
                    <div className="mt-1 rounded-md bg-white/95 px-2.5 py-0.5 text-[10px] font-black text-slate-900 shadow-md backdrop-blur">
                      Live Liveness Sync Active
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-1">
                  <div>
                    <p className="text-[10px] text-gray-400">CHECK-IN TIME</p>
                    <p className="mt-0.5 font-bold text-xs text-slate-800">
                      9:12 PM • 01-08-2026
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-gray-400">ACTION</p>
                    <p className="mt-0.5 text-xs font-bold text-gm-navy underline cursor-pointer">
                      View Live Photo
                    </p>
                  </div>
                </div>
              </div>

              <p className="mt-5 text-center text-xs text-gm-navy/60">
                Connected directly to your GateMan security backend audit logs.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Community */}
      <section id="community" className="px-6 py-12 lg:px-10 bg-sky-500/5">
        <div className="mx-auto max-w-7xl grid items-center gap-12 rounded-4xl border border-gray-200 bg-white p-7 sm:p-12 lg:grid-cols-2 lg:p-16">
          <div>
            <p className="text-xs font-montserrat font-bold uppercase tracking-[0.22em] text-gm-navy">
              Community & Communication
            </p>
            <h2 className="mt-5 text-4xl font-montserrat font-semibold leading-tight tracking-tight sm:text-5xl">
              Stay connected.
              <br />
              Share updates.
              <br />
              <span className="text-gray-400">Broadcast instantly.</span>
            </h2>
            <p className="mt-6 max-w-lg font-montserrat leading-7 text-gray-600">
              Bring your estate closer together with live community feeds,
              direct messaging between residents, and instant administrative
              alerts for guards and homeowners.
            </p>
            <ul className="mt-8 space-y-4 text-sm font-medium text-gray-700">
              {[
                "Community posts and comment discussions",
                "Direct messaging between estate residents",
                "Admin broadcasts to guards and residents",
                "Real-time estate announcements and alerts",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gm-gold/10 text-xs font-sans font-black text-gm-navy">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>

          {/* Interactive Community Feed & Notification Preview */}
          <div className="rounded-3xl bg-[#F8FAFC] p-5 sm:p-7 shadow-inner">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold">Estate Feed & Alerts</p>
                <p className="mt-1 text-xs text-gray-500">
                  Live community discussion & admin broadcast
                </p>
              </div>
              <span className="rounded-full bg-gm-navy/5 px-3 py-1.5 text-xs font-bold text-gm-navy">
                Active Now
              </span>
            </div>

            {/* Community Feed / Comment Preview */}
            <div className="mt-6 space-y-3">
              <div className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      AO
                    </div>
                    <div>
                      <p className="text-xs font-bold">Adeola (Block 4)</p>
                      <p className="text-[10px] text-gray-400">2 mins ago</p>
                    </div>
                  </div>
                  <span className="rounded bg-gm-gold/10 px-2 py-0.5 text-[9px] font-bold text-gm-navy">
                    Community Post
                  </span>
                </div>
                <p className="mt-2 text-xs text-gray-700 font-medium">
                  &quot;Great turn out at the association meeting yesterday! Are
                  we still on for the gate security upgrade review?&quot;
                </p>
                <div className="mt-3 flex items-center gap-4 border-t border-gray-50 pt-2.5 text-[11px] text-gray-500 font-semibold">
                  <span className="hover:text-gm-navy cursor-pointer">
                    💬 6 Comments
                  </span>
                  <span className="hover:text-gm-navy cursor-pointer">
                    ❤️ 14 Likes
                  </span>
                  <span className="text-blue-600 ml-auto cursor-pointer">
                    Direct Message ↗
                  </span>
                </div>
              </div>

              {/* Admin Broadcast Preview */}
              <div className="rounded-2xl border border-gm-navy/15 bg-gm-navy p-4 text-white shadow-md">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gm-gold text-xs font-black text-gm-navy">
                      📢
                    </span>
                    <p className="text-xs font-bold text-gm-gold">
                      Admin Broadcast
                    </p>
                  </div>
                  <span className="rounded-full bg-white/20 px-2 py-0.5 text-[9px] font-bold text-white">
                    Sent to Guards & Residents
                  </span>
                </div>
                <p className="mt-2 text-xs text-gm-navy">
                  &quot;Notice: Routine perimeter light check scheduled for 8 PM
                  tonight. All security personnel take note.&quot;
                </p>
              </div>
            </div>

            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-white border border-gray-200 p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gm-gold/10 text-lg text-gm-navy">
                💬
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">
                  Direct Resident Chat
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  Secure peer-to-peer messaging within the estate.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Facility Bookings & Services */}
      <section className="relative overflow-hidden bg-gm-navy py-20 sm:py-24 text-white">
        <div className="absolute -right-32 top-10 h-80 w-80 rounded-full bg-gm-gold/10 blur-3xl" />
        <div className="absolute -left-32 bottom-0 h-72 w-72 rounded-full bg-gm-navy/20 blur-3xl" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-montserrat font-semibold text-gm-gold shadow-sm">
              <CalendarDays className="h-4 w-4" />
              Convenience at your fingertips
            </span>

            <h2 className="mt-6 text-3xl font-montserrat font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
              Your estate facilities,
              <span className="block text-gm-gold">easier to access.</span>
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 font-montserrat text-white sm:text-lg">
              Make facility reservations, choose available time slots, and
              request estate-provided services without unnecessary delays or
              paperwork.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-2">
            {/* Facility Booking */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/6 p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-9">
              <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-150" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-gm-gold shadow-lg border border-white/10">
                    <CalendarDays className="h-7 w-7" />
                  </div>

                  <span className="text-4xl font-bold tracking-tight text-white/20">
                    04
                  </span>
                </div>

                <h3 className="mt-8 text-xl font-montserrat font-bold text-white sm:text-2xl">
                  Facility Access Management
                </h3>

                <p className="mt-3 leading-7 font-oswald text-slate-200">
                  Book shared estate facilities such as halls, sports areas, and
                  other amenities. Check availability and select your preferred
                  date and time before confirming a reservation.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "View available estate facilities",
                    "Choose dates and available time slots",
                    "Manage bookings and avoid scheduling conflicts",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gm-gold" />
                      <span className="text-sm text-slate-200 font-sans">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t font-oswald border-white/10 pt-5 text-sm font-semibold text-gm-gold">
                  Automated time-slot scheduling &amp; conflict prevention
                </div>
              </div>
            </div>

            {/* Estate Services */}
            <div className="group relative overflow-hidden rounded-3xl border border-white/10 bg-white/[0.06] p-7 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl sm:p-9">
              <div className="absolute right-0 top-0 h-36 w-36 rounded-full bg-white/5 transition-transform duration-500 group-hover:scale-150" />

              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-gm-gold shadow-lg border border-white/10">
                    <Wrench className="h-7 w-7" />
                  </div>

                  <span className="text-4xl font-bold tracking-tight text-white/20">
                    08
                  </span>
                </div>

                <h3 className="mt-8 text-xl font-montserrat font-bold text-white sm:text-2xl">
                  Service Requests &amp; Dispatch
                </h3>

                <p className="mt-3 leading-7 font-oswald text-slate-200">
                  Request services provided by your estate and make it easier
                  for management to coordinate the right people to handle them.
                  Keep residents informed as requests progress.
                </p>

                <div className="mt-6 space-y-3">
                  {[
                    "Submit requests for estate-provided services",
                    "Keep track of request progress",
                    "Improve coordination between residents and management",
                  ].map((item) => (
                    <div key={item} className="flex items-start gap-3">
                      <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-gm-gold" />
                      <span className="text-sm text-slate-200 font-sans">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="mt-8 border-t border-white/10 pt-5 text-sm font-oswald font-semibold text-gm-gold">
                  Centralized dispatch coordination &amp; progress tracking
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who we serve */}
      <section
        id="who-we-serve"
        className="scroll-mt-20 bg-sky-500/10 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-montserrat font-extrabold uppercase tracking-[0.2em] text-gm-navy">
                Who we serve
              </p>
              <h2 className="mt-4 text-3xl font-montserrat font-extrabold leading-tight tracking-[-0.035em] text-gm-navy sm:text-4xl lg:text-5xl">
                Designed for the places people live, work and gather.
              </h2>
            </div>
            <p className="max-w-md font-oswald text-sm leading-6 text-slate-600">
              GateMan supports organisations that need a more secure, efficient
              and scalable approach to property access and operations.
            </p>
          </div>

          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-14 lg:grid-cols-3">
            {audiences.map((item, i) => (
              <article
                key={item.title}
                className="group flex gap-4 rounded-2xl border border-slate-200/80 bg-white p-5 transition hover:border-gm-gold hover:shadow-lg hover:shadow-gm-navy/5 sm:p-6"
              >
                <span
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl text-2xl ${i % 2 === 0 ? "bg-gm-gold/10 text-gm-navy" : "bg-gm-navy/5 text-gm-navy"}`}
                >
                  {item.icon}
                </span>
                <div>
                  <h3 className="font-extrabold text-gm-navy font-oswald">
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 font-sans text-slate-600">
                    {item.text}
                  </p>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* About / differentiation */}
      <section
        id="about"
        className="scroll-mt-20 px-5 py-20 sm:px-8 sm:py-24 lg:px-12"
      >
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:gap-20">
          <div className="font-montserrat">
            <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-gm-navy">
              About GateMan Global Limited
            </p>
            <h2 className="mt-4 text-3xl font-extrabold leading-tight tracking-[-0.035em] text-gm-navy sm:text-4xl">
              We build the technology behind better-managed properties.
            </h2>
          </div>

          <div>
            <p className="text-base font-oswald leading-8 text-slate-600">
              GateMan Global Limited is a property access management and
              security operations technology company. Our mission is to simplify
              property access while improving safety, accountability and
              operational excellence through connected digital tools.
            </p>
            <p className="mt-5 font-sans text-base leading-8 text-slate-600">
              Our vision is to help shape the future of secure, intelligent and
              connected communities across Africa and beyond.
            </p>

            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {[
                {
                  title: "Technology-led",
                  text: "Digital tools for access, people and property operations.",
                },
                {
                  title: "Accountability-focused",
                  text: "Structured records, reporting and operational visibility.",
                },
                {
                  title: "Designed to scale",
                  text: "A platform for different property and facility environments.",
                },
                {
                  title: "Built around people",
                  text: "Tools for property managers, residents and security teams.",
                },
              ].map((item) => (
                <div
                  key={item.title}
                  className="rounded-2xl border border-slate-200 p-5"
                >
                  <h3 className="text-sm font-oswald tracking-widest font-extrabold text-gm-navy">
                    {item.title}
                  </h3>
                  <p className="mt-2 font-sans text-sm leading-6 text-slate-600">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-6 rounded-2xl border border-gm-gold/30 bg-gm-gold/10 p-5">
              <p className="text-sm font-oswald tracking-widest font-extrabold text-gm-navy">
                An important distinction
              </p>
              <p className="mt-2 font-sans text-sm leading-6 text-slate-700">
                GateMan provides the software platform. Security personnel are
                supplied and managed by the property owner or an independent
                security company.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section
        id="contact"
        className="scroll-mt-20 px-5 pb-20 sm:px-8 sm:pb-24 lg:px-12"
      >
        <div className="relative mx-auto max-w-7xl overflow-hidden rounded-4xl bg-gm-gold px-6 py-12 sm:px-10 sm:py-16 lg:px-16 lg:py-20">
          <div className="absolute -right-16 -top-20 h-72 w-72 rounded-full border-40 border-gm-navy/5" />
          <div className="absolute -bottom-32 right-1/3 h-72 w-72 rounded-full bg-white/20 blur-3xl" />

          <div className="relative grid gap-10 lg:grid-cols-[1fr_0.75fr] lg:items-center lg:gap-16">
            <div>
              <span className="inline-flex rounded-full border border-gm-navy/15 bg-gm-charcoal px-3 py-1.5 text-[10px] font-montserrat font-extrabold uppercase tracking-[0.16em] text-white">
                Let&apos;s talk about your property
              </span>
              <h2 className="mt-5 max-w-2xl text-3xl font-montserrat font-extrabold leading-tight tracking-[-0.04em] text-gm-navy sm:text-4xl lg:text-5xl">
                Ready to rethink how your property operates?
              </h2>
              <p className="mt-5 font-sans max-w-xl text-base leading-7 text-gm-navy/75">
                Tell us about your organisation and discover how GateMan can
                support your property access and operational management needs.
              </p>
              <div className="mt-7 flex flex-wrap gap-3">
                {[
                  "Visitor management",
                  "Resident access",
                  "Security operations",
                ].map((label) => (
                  <span
                    key={label}
                    className="rounded-full border border-gm-navy/15 bg-gm-charcoal px-3 py-2 text-xs  font-oswald tracking-widest font-semibold text-white"
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>

            <form
              // onSubmit={handleContact}
              className="relative rounded-2xl border border-white/60 bg-white p-5 shadow-xl shadow-gm-navy/10 sm:p-7"
            >
              <h3 className="text-lg font-montserrat font-extrabold text-gm-navy">
                Start a conversation
              </h3>
              <p className="mt-1 text-sm font-sans text-slate-500">
                Share your details to enquire about the platform.
              </p>

              <label
                htmlFor="organisation"
                className="mt-5 block text-xs font-oswald tracking-wider font-bold text-slate-700"
              >
                Organisation / property name
              </label>
              <input
                id="organisation"
                type="text"
                // value={organisation}
                // onChange={(e) => setOrganisation(e.target.value)}
                placeholder="e.g. Greenview Estate"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-gm-navy focus:ring-2 focus:ring-gm-navy/10"
              />

              <label
                htmlFor="email"
                className="mt-4 block text-xs font-oswald font-bold tracking-wider text-slate-700"
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
                className="mt-2 w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-gm-navy focus:ring-2 focus:ring-gm-navy/10"
              />

              <button
                type="submit"
                className="mt-5 flex w-full items-center justify-center gap-2 rounded-full bg-gm-charcoal px-5 py-4 text-sm font-oswald font-bold tracking-widest text-gm-gold transition hover:bg-gm-charcoal/70"
              >
                Enquire about GateMan <ArrowIcon />
              </button>
              <p className="mt-3 text-center font-sans text-[12px] leading-5 text-slate-400">
                This opens your default email application with your enquiry
                prepared.
              </p>
            </form>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-100 bg-gm-charcoal px-5 py-10 sm:px-8 lg:px-12">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
            <div className="max-w-sm">
              <div className="flex items-center">
                <img
                  src="/gm_landing_logo.jpg"
                  alt="GateMan Logo"
                  className="h-12 w-20"
                />
                <div className="flex h-full items-center">
                  <img
                    src="/gmlanding_2.jpg"
                    alt="GateMan Logo"
                    className="h-8 w-40"
                  />
                </div>
              </div>
              <p className="mt-4 text-sm leading-6 text-slate-300 font-sans">
                Property access management and security operations technology
                for better-managed, digitally connected communities.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-x-10 gap-y-6 sm:gap-x-16">
              <div>
                <p className="text-xs font-oswald font-extrabold uppercase tracking-wider text-gm-gold">
                  Platform
                </p>
                <div className="mt-4 space-y-3">
                  <a
                    href="#platform"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    Visitor management
                  </a>
                  <a
                    href="#platform"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    Resident management
                  </a>
                  <a
                    href="#platform"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    Security operations
                  </a>
                  <a
                    href="#platform"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    Estate management
                  </a>
                </div>
              </div>
              <div>
                <p className="text-xs font-oswald font-extrabold uppercase tracking-wider text-gm-gold">
                  Company
                </p>
                <div className="mt-4 space-y-3">
                  <a
                    href="#about"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    About GateMan
                  </a>
                  <a
                    href="#who-we-serve"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    Who we serve
                  </a>
                  <a
                    href="#how-it-works"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    How it works
                  </a>
                  <a
                    href="#contact"
                    className="block text-sm text-slate-300 hover:text-gm-gold/60"
                  >
                    Contact
                  </a>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-10 flex flex-col gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-xs text-slate-400">
              © {new Date().getFullYear()} GateMan Global Limited. All rights
              reserved.
            </p>
            <p className="text-xs text-slate-400">
              Intelligent access. Accountable operations. Connected communities.
            </p>
          </div>
        </div>
      </footer>
    </main>
  );
}
