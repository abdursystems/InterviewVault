import React, { useState } from 'react'
import { FaRegEye, FaRegEyeSlash } from "react-icons/fa6"

const Input = ({ value, onChange, label, placeholder, type }) => {

    const [showPassword, setShowPassword] = useState(false)

    const toggleShowPassword = () => {
        setShowPassword(!showPassword)
    }

    return (
        <div className="mb-4 group">
            {/* label */}
            <label className='block mb-1 text-[13px] font-medium
            text-slate-800 transition-all duration-200
            group-focus-within:text-amber-600'>
                {label}
            </label>

            {/* input wrapper */}
            <div
                className='relative flex items-center gap-2 px-4 py-3
                rounded-2xl border border-slate-200
                bg-white/70 backdrop-blur-md
                shadow-sm transition-all duration-300
                focus-within:border-amber-400
                focus-within:shadow-[0_0_0_4px_rgba(251,191,36,0.25)]
                hover:border-slate-300'
            >
                {/* input */}
                <input
                    type={type === "password"
                        ? (showPassword ? "text" : "password")
                        : type}
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e)}
                    className='w-full bg-transparent outline-none text-sm
                    text-slate-900 placeholder:text-slate-400'
                />

                {/* password toggle */}
                {type === "password" && (
                    <button
                        type="button"
                        onClick={toggleShowPassword}
                        className='text-slate-400 hover:text-amber-600
                        transition-all duration-200
                        active:scale-90'
                    >
                        {showPassword ? (
                            <FaRegEye size={20} />
                        ) : (
                            <FaRegEyeSlash size={20} />
                        )}
                    </button>
                )}
            </div>
        </div>
    )
}

export default Input
