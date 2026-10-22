import React, { useContext } from 'react'
import { UserContext } from '../../context/userContext'
import { useNavigate } from 'react-router-dom'

const ProfileInfoCard = () => {

    const { user, clearUser } = useContext(UserContext)
    const navigate = useNavigate()

    const handleLogout = () => {
        localStorage.clear()
        clearUser()
        navigate("/")
    }

    return (
        user && (
            <div className='flex items-center'>
                {/* <img
                    src={user.profileImageUrl}
                    alt=""
                    className='w-11 h-11 bg-gray-300 rounded-full mr-3'
                /> */}

                <div className='w-11 h-11 flex items-center justify-center bg-primary text-white text-lg font-semibold rounded-full mr-3 uppercase'>
                    {user.name ? user.name.charAt(0) : ""}
                </div>

                <div>
                    <div className='text-[15px] text-black font-bold leading-3'>
                        {user.name || ""}
                    </div>

                    <button className='text-amber-600 text-sm font-semibold cursor-pointer hover:underline' onClick={handleLogout}>
                        Log Out
                    </button>

                </div>
            </div>
        )
    )
}

export default ProfileInfoCard