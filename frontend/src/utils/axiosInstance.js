import axios from "axios"
import { BASE_URL } from "./apiPaths.js"

const axiosInstance = axios.create({
    baseURL: BASE_URL,
    timeout: 80000,
    headers: {
        "Content-Type": "application/json",
        Accept: "application/json"
    }
})

// request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        const accessToken = localStorage.getItem("token")
        if (accessToken) {
            config.headers.Authorization = `Bearer ${accessToken}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

axiosInstance.interceptors.response.use(
    (response) => {
        return response
    },
    (error) => {
        if (error.response) {
            console.log("Status:", error.response.status)
            console.log("Data:", error.response.data)
            console.log("Message:", error.response.data?.message)

            if (error.response.status === 401) {
                window.location.href = "/"
            }
        } else if (error.code === "ECONNABORTED") {
            console.log("Request Timeout. Please Try Again.")
        } else {
            console.log("Network Error:", error.message)
        }
        return Promise.reject(error)
    }
)

// response interceptor
// axiosInstance.interceptors.response.use(
//     (response) => {
//         return response
//     },
//     (error) => {
//         // handle common errors globally
//         if (error.response) {
//             if (error.response.status === 401) {
//                 // redirect to login page
//                 window.location.href = "/"
//             } else if (error.response.status) {
//                 console.log("Server Error. Please Try Again Later.")
//             }
//         } else if (error.code === "ECONNABORTED") {
//             console.log("Request Timeout. Please Try Again.")
//         }
//         return Promise.reject(error)
//     }
// )

export default axiosInstance