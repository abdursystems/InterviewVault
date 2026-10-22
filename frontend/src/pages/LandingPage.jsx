import React, { useContext, useState } from 'react'
import { APP_FEATURES } from "../utils/data.js"
import { useNavigate } from 'react-router-dom'
import { LuSparkles } from "react-icons/lu"
import Model from '../components/Model.jsx'
import Login from "../pages/Auth/Login.jsx"
import SignUp from "../pages/Auth/SignUp.jsx"
import { UserContext } from '../context/userContext.jsx'
import ProfileInfoCard from '../components/Cards/ProfileInfoCard.jsx'

const LandingPage = () => {

    const { user } = useContext(UserContext)

    const navigate = useNavigate()

    const [openAuthModel, setOpenAuthModel] = useState(false)
    const [currentPage, setCurrentPage] = useState("login")
    const [isMenuOpen, setIsMenuOpen] = useState(false)


    const handleCTA = () => {
        if (!user) {
            setOpenAuthModel(true)
        } else {
            navigate("/dashboard")
        }
    }

    return (
        <>
            {/* HERO + HEADER */}
            <div className="relative w-full bg-[#fffcef] overflow-hidden">
                {/* background glow */}
                <div className="absolute -top-20 -left-20 w-105 h-105 bg-amber-300/30 blur-[120px]" />
                <div className="absolute top-1/4 right-0 w-90 h-90 bg-orange-200/40 blur-[110px]" />

                <div className="container mx-auto px-6 lg:px-10 pt-8 pb-10 relative z-10">
                    {/* header */}
                    <header className="flex items-center justify-between mb-12 animate-fade-in">
                        <h1 className="text-2xl font-bold tracking-tight text-black">
                            Interview Buddy
                        </h1>

                        {/* <button
                            onClick={() => setOpenAuthModel(true)}
                            className="rounded-full bg-linear-to-r from-[#ff9a4b] to-[#f3b44d] px-8 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                        >
                            Login / Sign Up
                        </button> */}

                        {/* DESKTOP BUTTONS */}
                        <div className="hidden md:flex items-center gap-4">
                            {user ? (
                                // 🔹 Login ke baad sirf ek profile card
                                <ProfileInfoCard />
                            ) : (
                                // 🔹 Logout ke baad Login + Signup buttons
                                <>
                                    <button
                                        onClick={() => {
                                            setCurrentPage("login")
                                            setOpenAuthModel(true)
                                        }}
                                        className="rounded-full border border-amber-300
                                        px-6 py-2.5 text-sm font-semibold text-black
                                      hover:bg-amber-100 transition-all duration-300 hover:shadow-2xl hover:scale-105"
                                    >
                                        Login
                                    </button>

                                    <button
                                        onClick={() => {
                                            setCurrentPage("signup")
                                            setOpenAuthModel(true)
                                        }}
                                        className="rounded-full bg-linear-to-r from-[#ff9a4b] to-[#f3b44d]
                                        px-8 py-2.5 text-sm font-semibold text-white
                                        shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300"
                                    >
                                        Sign Up
                                    </button>
                                </>
                            )}
                        </div>


                        {/* MOBILE MENU ICON */}
                        <button
                            className="md:hidden text-2xl"
                            onClick={() => setIsMenuOpen(true)}
                        >
                            ☰
                        </button>
                    </header>

                    {/* hero */}
                    <div className="grid grid-cols-1 md:grid-cols-2 items-center gap-10">
                        <div className="animate-slide-up">
                            <span className="inline-flex items-center gap-2 mb-4 rounded-full border border-amber-300 bg-amber-100 px-4 py-1 text-xs font-semibold text-amber-700">
                                <LuSparkles /> AI Powered
                            </span>

                            <h2 className="text-4xl md:text-5xl lg:text-6xl font-medium leading-tight text-black">
                                Ace Interviews with <br />
                                <span className="font-semibold text-transparent bg-clip-text bg-[radial-gradient(circle,#ff9324_0%,#fcd760_100%)] bg-size-[200%_200%] animate-text-shine">
                                    AI-Powered
                                </span>{" "}
                                Learning
                            </h2>
                        </div>

                        <div className="animate-slide-up delay-150">
                            <p className="text-base md:text-lg text-gray-800 leading-relaxed mb-6">
                                Get role-specific questions, expand answers on demand,
                                dive deep into concepts, and organize everything your way.
                            </p>

                            <button
                                onClick={handleCTA}
                                className="rounded-full bg-black px-9 py-3 text-sm font-semibold text-white hover:bg-amber-100 hover:text-black hover:border-amber-300 border border-transparent transition-all duration-300 active:scale-95 active:shadow-inner"
                            >
                                Get Started
                            </button>
                        </div>
                    </div>
                </div>

                <div className="h-10 bg-linear-to-b from-[#fffcef] to-transparent" />
            </div>

            {/* FEATURES */}
            <div className="w-full bg-[#fffcef] pb-20">
                <div className="container mx-auto px-6 lg:px-10">
                    <h3 className="text-3xl font-semibold text-center mb-12 animate-fade-in">
                        Features That Make You Shine ✨
                    </h3>

                    <div className="space-y-10">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {APP_FEATURES.slice(0, 3).map((feature) => (
                                <div
                                    key={feature.id}
                                    className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-amber-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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
                                    className="group bg-white/70 backdrop-blur-xl p-6 rounded-2xl border border-amber-100 shadow-md hover:shadow-2xl hover:-translate-y-1 transition-all duration-300"
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
            </div>

            {/* HOW IT WORKS */}
            <div className="relative w-full bg-[#fffcef] py-24 overflow-hidden">
                {/* background glow */}
                <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-130 h-130 bg-amber-200/30 blur-[150px]" />

                <div className="container mx-auto px-6 lg:px-10 relative z-10">
                    {/* heading */}
                    <div className="text-center mb-20 animate-fade-in">
                        <h3 className="text-3xl md:text-4xl font-semibold mb-4">
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
                        <div className="hidden md:block absolute top-16 left-0 right-0 h-0.5 bg-linear-to-r from-transparent via-amber-300 to-transparent" />

                        {[
                            {
                                step: "1",
                                title: "Choose Your Role",
                                desc: "Tell us your job role, experience level, and focus areas to generate personalized interview questions.",
                                tag: "Personalized"
                            },
                            {
                                step: "2",
                                title: "Learn with AI",
                                desc: "Get AI-powered answers, understand the ‘why’ behind each concept, and expand explanations instantly.",
                                tag: "AI Powered"
                            },
                            {
                                step: "3",
                                title: "Track & Master",
                                desc: "Save questions, add your own notes, revisit weak areas, and walk into interviews with confidence.",
                                tag: "Progress Driven"
                            }
                        ].map((item, i) => (
                            <div
                                key={i}
                                className="group relative text-center p-8 rounded-3xl bg-white/70 backdrop-blur-xl border border-amber-100 shadow-md hover:shadow-2xl hover:-translate-y-2 transition-all duration-300 animate-slide-up"
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
                    <div className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-8 animate-fade-in">
                        {[
                            "Role-specific questions",
                            "Clear & structured answers",
                            "Smart notes & revision"
                        ].map((text, i) => (
                            <div
                                key={i}
                                className="flex items-center gap-3 justify-center md:justify-start bg-white/60 backdrop-blur rounded-xl px-6 py-4 border border-amber-100 shadow-sm"
                            >
                                <span className="text-amber-500 text-lg">✔</span>
                                <span className="text-gray-700 font-medium">{text}</span>
                            </div>
                        ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-24 flex flex-col md:flex-row items-center justify-between gap-6 p-12 rounded-3xl bg-linear-to-r from-amber-100 to-orange-100 border border-amber-200 shadow-2xl animate-fade-in">
                        <div>
                            <h4 className="text-xl md:text-2xl font-semibold text-black mb-2">
                                Ready to crack your next interview?
                            </h4>
                            <p className="text-gray-700">
                                Start practicing smarter with AI-powered guidance.
                            </p>
                        </div>

                        <button
                            onClick={handleCTA}
                            className="rounded-full bg-black px-12 py-3 text-sm font-semibold text-white hover:bg-amber-100 hover:text-black hover:border-amber-300 border border-transparent transition-all duration-300 active:scale-95 active:shadow-inner"
                        >
                            Start Practicing Now
                        </button>
                    </div>
                </div>
            </div>

            {/* MOBILE MENU */}
            {isMenuOpen && (
                <div className="fixed inset-0 z-50 bg-black/40">
                    <div className="absolute top-0 right-0 w-64 h-full
                    bg-[#fffcef] p-6 shadow-2xl animate-slide-up">

                        <button
                            className="text-xl mb-6"
                            onClick={() => setIsMenuOpen(false)}
                        >
                            ✕
                        </button>

                        <button
                            onClick={() => {
                                setCurrentPage("login")
                                setOpenAuthModel(true)
                                setIsMenuOpen(false)
                            }}
                            className="w-full mb-4 rounded-full border border-amber-300 px-6 py-3 text-sm font-semibold text-black
                            hover:bg-amber-100 transition"
                        >
                            Login
                        </button>

                        <button
                            onClick={() => {
                                setCurrentPage("signup")
                                setOpenAuthModel(true)
                                setIsMenuOpen(false)
                            }}
                            className="w-full rounded-full bg-linear-to-r from-[#ff9a4b] to-[#f3b44d]
                            px-6 py-3 text-sm font-semibold text-white"
                        >
                            Sign Up
                        </button>
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
                    setOpenAuthModel(false)
                    setCurrentPage("login")
                }}
                hideHeader
            >
                <div>
                    {currentPage === "login" && (
                        <Login setCurrentPage={setCurrentPage} />
                    )}
                    {currentPage === "signup" && (
                        <SignUp setCurrentPage={setCurrentPage} />
                    )}
                </div>
            </Model>

        </>
    )
}

export default LandingPage