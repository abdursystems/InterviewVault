import React, { useContext, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Input from '../../components/Inputs/Input.jsx'
import ProfilePhotoSelector from '../../components/Inputs/ProfilePhotoSelector.jsx'
import { validateEmail } from '../../utils/helper.js'
import { UserContext } from '../../context/userContext.jsx'
import axiosInstance from '../../utils/axiosInstance.js'
import { API_PATHS } from '../../utils/apiPaths.js'
import uploadImage from '../../utils/uploadImage.js'

const SignUp = ({ setCurrentPage }) => {

    const [profilePic, setProfilePic] = useState(null)
    const [fullName, setFullName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const [error, setError] = useState(null)

    const { updateUser } = useContext(UserContext)
    const navigate = useNavigate()

    // Handle Signup form submit
    const handleSignUp = async (e) => {
        e.preventDefault()

        let profileImageUrl = ""

        if (!fullName) {
            setError("Please Enter Full Name.")
            return
        }

        if (!validateEmail(email)) {
            setError("Please Enter a valid Email address.")
            return
        }

        if (!password) {
            setError("Please Enter a Password.")
            return
        }

        setError("")

        // Signup API Call
        try {
            // upload image if present
            if (profilePic) {
                const imgUploadRes = await uploadImage(profilePic)
                profileImageUrl = imgUploadRes.imageUrl || ""
            }

            const response = await axiosInstance.post(API_PATHS.AUTH.REGISTER, {
                name: fullName,
                email,
                password,
                profileImageUrl,
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
            <h3 className='text-lg font-semibold text-black'>Create an Account</h3>
            <p className='text-xs text-slate-800 mt-1.25 mb-6'>Join Us Today by Entering Yout Details Below.</p>

            <form onSubmit={handleSignUp}>

                <ProfilePhotoSelector image={profilePic} setImage={setProfilePic} />

                <div className='grid grid-cols-1 md:grid-cols-1 gap-2'>
                    <Input
                        value={fullName}
                        onChange={({ target }) => setFullName(target.value)}
                        label="Full Name"
                        placeholder="Enter Your Name"
                        type="text"
                    />

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

                </div>

                {error && <p className='text-red-500 text-xs pb-2.5'>{error}</p>}

                <button type='submit' className='btn-primary transition-transform duration-150 ease-out hover:scale-[1.02] active:scale-[0.96]'>
                    Sign Up
                </button>

                <p className='text-[13px] text-slate-900 mt-3'>
                    Already an Account?{" "}
                    <button className='font-medium text-primary underline cursor-pointer' onClick={() => {
                        setCurrentPage("login")
                    }}>
                        Log In
                    </button>
                </p>

            </form>

        </div>
    )
}

export default SignUp