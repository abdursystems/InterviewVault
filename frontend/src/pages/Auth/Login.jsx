import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../../components/Inputs/Input.jsx'
import { validateEmail } from '../../utils/helper.js'
import axiosInstance from '../../utils/axiosInstance.js'
import { API_PATHS } from '../../utils/apiPaths.js'
import { UserContext } from '../../context/userContext.jsx'

const Login = ({ setCurrentPage }) => {

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [error, setError] = useState(null)

    const { updateUser } = useContext(UserContext)

    const navigate = useNavigate()

    // Handle login form submit
    const handleLogin = async (e) => {
        e.preventDefault()

        if (!validateEmail(email)) {
            setError("Please Enter a Valid Email address.")
            return
        }

        if (!password) {
            setError("Please Enter the Password.")
            return
        }

        setError("")

        // Login API Call
        try {
            const response = await axiosInstance.post(API_PATHS.AUTH.LOGIN, {
                email,
                password
            })

            const { token } = response.data

            if (token) {
                localStorage.setItem("token", token)
                updateUser(response.data)
                navigate("/dashboard")
            }

        } catch (error) {
            if (error.response && error.response.data.message) {
                setError(error.response.data.message)
            } else {
                setError("Something Went Wrong. Please try again.")
            }
        }
    }

    return (
        <div className='w-[90vw] md:w-[33vw] p-7 flex flex-col justify-center'>
            <h3 className='text-lg font-semibold text-black'>Welcome Back</h3>
            <p className='text-xs text-slate-700 mt-1.25 mb-6'>Please Enter Your Details to Log In</p>

            <form onSubmit={handleLogin}>
                <Input
                    value={email}
                    onChange={({ target }) => setEmail(target.value)}
                    label="Email Address"
                    placeholder="Enter Your Email Here"
                    type="email"
                />

                <Input
                    value={password}
                    onChange={({ target }) => setPassword(target.value)}
                    label="Password"
                    placeholder="Minimum 8 Characters"
                    type="password"
                />

                {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}

                <button
                    type="submit"
                    className="btn-primary transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.96]">
                    Log In
                </button>


                <p className='text-[13px] text-slate-800 mt-3'>
                    Don't Have an Account?{" "}
                    <button className='font-medium text-primary underline cursor-pointer' onClick={() => {
                        setCurrentPage("signup")
                    }}>
                        Sign Up
                    </button>
                </p>

            </form>
        </div >
    )
}

export default Login