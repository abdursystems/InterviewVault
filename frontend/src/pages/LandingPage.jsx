import React, { useContext, useEffect, useState } from "react";
import { APP_FEATURES } from "../utils/data.js";
import { useNavigate } from "react-router-dom";
import { LuSparkles } from "react-icons/lu";
import Model from "../components/Model.jsx";
import Login from "../pages/Auth/Login.jsx";
import SignUp from "../pages/Auth/SignUp.jsx";
import { UserContext } from "../context/userContext.jsx";
import ProfileInfoCard from "../components/Cards/ProfileInfoCard.jsx";

// Shared keyboard-focus style for every interactive element
const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffcef]";

const LandingPage = () => {
  const { user } = useContext(UserContext);

  const navigate = useNavigate();

  const [openAuthModel, setOpenAuthModel] = useState(false);
  const [currentPage, setCurrentPage] = useState("login");
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Mobile menu: close on Escape and lock background scroll while open
  useEffect(() => {
    if (!isMenuOpen) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") setIsMenuOpen(false);
    };
    const previousOverflow = document.body.style.overflow;

    document.addEventListener("keydown", onKeyDown);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [isMenuOpen]);

  const handleCTA = () => {
    if (!user) {
      setOpenAuthModel(true);
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <>
      {/* HERO + HEADER */}
      <section className="relative w-full bg-[#fffcef] overflow-hidden">
        {/* background glow */}
        <div
          aria-hidden="true"
          className="absolute -top-20 -left-20 w-105 h-105 bg-amber-100/30 blur-[120px]"
        />
        <div
          aria-hidden="true"
          className="absolute top-1/4 right-0 w-90 h-90 bg-amber-100/40 blur-[110px]"
        />

        <div className="container mx-auto px-6 lg:px-10 pt-8 pb-10 relative z-10">
          {/* header */}
          <header className="flex items-center justify-between mb-12 animate-fade-in motion-reduce:animate-none">
            <h1 className="text-2xl font-bold tracking-tight text-black">
              Interview Buddy
            </h1>

            {/* DESKTOP BUTTONS */}
            <div className="hidden md:flex items-center gap-4">
              {user ? (
                // Logged in: show only the profile card
                <ProfileInfoCard />
              ) : (
                // Logged out: Login + Sign Up buttons
                <>
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage("login");
                      setOpenAuthModel(true);
                    }}
                    className={`rounded-full border border-amber-300 px-6 py-2.5 text-sm font-semibold text-black hover:bg-amber-100 transition-all duration-300 hover:shadow-2xl hover:scale-105 motion-reduce:transition-none motion-reduce:hover:scale-100 ${focusRing}`}
                  >
                    Login
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setCurrentPage("signup");
                      setOpenAuthModel(true);
                    }}
                    className={`rounded-full bg-linear-to-r from-[#ff9a4b] to-[#f3b44d] px-8 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:scale-100 ${focusRing}`}
                  >
                    Sign Up
                  </button>
                </>
              )}
            </div>

            {/* MOBILE MENU ICON */}
            <button
              type="button"
              className={`md:hidden text-2xl rounded-md px-2 ${focusRing}`}
              onClick={() => setIsMenuOpen(true)}
              aria-label="Open menu"
              aria-expanded={isMenuOpen}
            >
              ☰
            </button>
          </header>

          {/* hero */}
          <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
            <div className="animate-slide-up motion-reduce:animate-none">
              <span className="inline-flex items-center gap-2 mb-4 rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-700">
                <LuSparkles aria-hidden="true" /> AI Powered
              </span>

              <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-black text-balance">
                Ace Interviews with <br />
                <span className="font-semibold text-transparent bg-clip-text bg-[radial-gradient(circle,#ff9324_0%,#fcd760_100%)] bg-size-[200%_200%] animate-text-shine motion-reduce:animate-none">
                  AI-Powered
                </span>{" "}
                Learning
              </h2>
            </div>

            <div
              className="animate-slide-up motion-reduce:animate-none"
              style={{ animationDelay: "150ms" }}
            >
              <p className="text-base md:text-lg text-gray-800 leading-relaxed mb-6 max-w-prose">
                Get role-specific questions, expand answers on demand, dive deep
                into concepts, and organize everything your way.
              </p>

              <button
                type="button"
                onClick={handleCTA}
                className={`rounded-full bg-black px-9 py-3 text-sm font-semibold text-white hover:bg-amber-100 hover:text-black hover:border-amber-300 border border-transparent transition-all duration-300 active:scale-95 active:shadow-inner motion-reduce:transition-none ${focusRing}`}
              >
                Get Started
              </button>
            </div>
          </div>
        </div>

        <div className="h-10 bg-linear-to-b from-[#fffcef] to-transparent" />
      </section>

      {/* FEATURES */}
      <section className="w-full bg-[#fffcef] pb-20">
        <div className="container mx-auto px-6 lg:px-10">
          <h3 className="text-3xl font-semibold text-center mb-12 animate-fade-in motion-reduce:animate-none text-balance">
            Features That Make You Shine ✨
          </h3>

          <div className="space-y-10">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {APP_FEATURES.slice(0, 3).map((feature) => (
                <div
                  key={feature.id}
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-amber-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <h4 className="font-semibold mb-2 group-hover:text-amber-600 transition">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:px-28">
              {APP_FEATURES.slice(3).map((feature) => (
                <div
                  key={feature.id}
                  className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-amber-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                >
                  <h4 className="font-semibold mb-2 group-hover:text-amber-600 transition">
                    {feature.title}
                  </h4>
                  <p className="text-gray-600">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="relative w-full bg-[#fffcef] py-24 overflow-hidden">
        {/* background glow */}
        <div
          aria-hidden="true"
          className="absolute -top-24 left-1/2 -translate-x-1/2 w-130 h-130 bg-amber-200/30 blur-[150px]"
        />

        <div className="container mx-auto px-6 lg:px-10 relative z-10">
          {/* heading */}
          <div className="text-center mb-20 animate-fade-in motion-reduce:animate-none">
            <h3 className="text-3xl md:text-4xl font-semibold mb-4 text-balance">
              How Interview Buddy Works 🚀
            </h3>
            <p className="max-w-2xl mx-auto text-gray-700 text-base md:text-lg">
              A simple, smart, and structured way to prepare for interviews —
              powered by AI and designed for real results.
            </p>
          </div>

          {/* steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-12">
            {/* connecting line (desktop only) */}
            <div
              aria-hidden="true"
              className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-amber-300 to-transparent"
            />

            {[
              {
                step: "1",
                title: "Choose Your Role",
                desc: "Tell us your job role, experience level, and focus areas to generate personalized interview questions.",
                tag: "Personalized",
              },
              {
                step: "2",
                title: "Learn with AI",
                desc: "Get AI-powered answers, understand the ‘why’ behind each concept, and expand explanations instantly.",
                tag: "AI Powered",
              },
              {
                step: "3",
                title: "Track & Master",
                desc: "Save questions, add your own notes, revisit weak areas, and walk into interviews with confidence.",
                tag: "Progress Driven",
              },
            ].map((item, i) => (
              <div
                key={item.step}
                className="group relative text-center p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-amber-100 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up motion-reduce:animate-none motion-reduce:transition-none motion-reduce:hover:translate-y-0"
                style={{ animationDelay: `${i * 150}ms` }}
              >
                {/* step number */}
                <div className="mx-auto mb-6 w-16 h-16 flex items-center justify-center rounded-full bg-linear-to-br from-amber-400 to-orange-400 text-white text-2xl font-bold shadow-xl">
                  {item.step}
                </div>

                <h4 className="text-lg font-semibold mb-3 group-hover:text-amber-600 transition">
                  {item.title}
                </h4>

                <p className="text-gray-600 leading-relaxed mb-4">
                  {item.desc}
                </p>

                {/* tag */}
                <span className="inline-block text-xs font-semibold px-3 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  {item.tag}
                </span>
              </div>
            ))}
          </div>

          {/* extra highlights */}
          <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in motion-reduce:animate-none">
            {[
              "Role-specific questions",
              "Clear & structured answers",
              "Smart notes & revision",
            ].map((text) => (
              <div
                key={text}
                className="flex items-center gap-3 justify-center md:justify-start bg-white/60 backdrop-blur rounded-xl px-6 py-4 border border-amber-100 shadow-sm"
              >
                <span aria-hidden="true" className="text-amber-500 text-lg">
                  ✔
                </span>
                <span className="text-gray-700 font-medium">{text}</span>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-24 flex flex-col md:flex-row items-center justify-between gap-6 p-8 md:p-12 rounded-3xl bg-linear-to-r from-amber-100 to-orange-100 border border-amber-200 shadow-2xl animate-fade-in motion-reduce:animate-none">
            <div className="text-center md:text-left">
              <h4 className="text-xl md:text-2xl font-semibold text-black mb-2">
                Ready to crack your next interview?
              </h4>
              <p className="text-gray-700">
                Start practicing smarter with AI-powered guidance.
              </p>
            </div>

            <button
              type="button"
              onClick={handleCTA}
              className={`rounded-full bg-black px-12 py-3 text-sm font-semibold text-white hover:bg-amber-100 hover:text-black hover:border-amber-300 border border-transparent transition-all duration-300 active:scale-95 active:shadow-inner motion-reduce:transition-none ${focusRing}`}
            >
              Start Practicing Now
            </button>
          </div>
        </div>
      </section>

      {/* MOBILE MENU */}
      {isMenuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setIsMenuOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Navigation menu"
            onClick={(e) => e.stopPropagation()}
            className="absolute top-0 right-0 w-64 h-full bg-[#fffcef] p-6 shadow-2xl animate-slide-up motion-reduce:animate-none"
          >
            <button
              type="button"
              className={`text-xl mb-6 rounded-md px-2 ${focusRing}`}
              onClick={() => setIsMenuOpen(false)}
              aria-label="Close menu"
            >
              ✕
            </button>

            {user ? (
              // Logged in: the desktop profile card is hidden on mobile, so show it here
              <ProfileInfoCard />
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage("login");
                    setOpenAuthModel(true);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full mb-4 rounded-full border border-amber-300 px-6 py-3 text-sm font-semibold text-black hover:bg-amber-100 transition ${focusRing}`}
                >
                  Login
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setCurrentPage("signup");
                    setOpenAuthModel(true);
                    setIsMenuOpen(false);
                  }}
                  className={`w-full rounded-full bg-linear-to-r from-[#ff9a4b] to-[#f3b44d] px-6 py-3 text-sm font-semibold text-white ${focusRing}`}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER */}
      <footer className="bg-gray-50 py-4 text-center text-sm text-gray-600">
        Made with ❤️ — Happy Coding
      </footer>

      <Model
        isOpen={openAuthModel}
        onClose={() => {
          setOpenAuthModel(false);
          setCurrentPage("login");
        }}
        hideHeader
      >
        <div>
          {currentPage === "login" && <Login setCurrentPage={setCurrentPage} />}
          {currentPage === "signup" && (
            <SignUp setCurrentPage={setCurrentPage} />
          )}
        </div>
      </Model>
    </>
  );
};

export default LandingPage;
