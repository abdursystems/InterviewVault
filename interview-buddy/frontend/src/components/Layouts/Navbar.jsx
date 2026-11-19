import React from 'react'
import { Link } from 'react-router-dom'
import ProfileInfoCard from '../Cards/ProfileInfoCard.jsx'

const Navbar = () => {
    return (
        <div className="sticky top-0 z-50 w-full bg-white/70 backdrop-blur-xl border-b border-orange-200/60 shadow-md">
            <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-6 lg:px-8">

                {/* Logo / Brand */}
                <Link to="/dashboard" className="group relative">
                    <h2 className="text-lg md:text-xl font-extrabold bg-linear-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent tracking-tight transition-all duration-300 group-hover:tracking-wide">
                        Interview Buddy
                    </h2>

                    {/* underline glow */}
                    <span className="absolute -bottom-1 left-0 h-0.5 w-0 bg-linear-to-r from-orange-500 to-amber-400 transition-all duration-300 group-hover:w-full" />
                </Link>

                {/* Right Section */}
                <div className="flex items-center gap-3 sm:gap-4 pr-1 sm:pr-2">

                    {/* Profile (no ring / border) */}
                    <div className="transition-transform duration-200 hover:scale-[1.03]">
                        <ProfileInfoCard />
                    </div>

                </div>

            </div>
        </div>
    )
}

export default Navbar