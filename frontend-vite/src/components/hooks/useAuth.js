import axios from "../lib/axios"; // Path to your axios config
import { useState, useEffect } from "react";

export const useAuth = () => {
const [user, setUser] = useState(null);
const [loading, setLoading] = useState(true);

// 1. Initial Check: See if user is already logged in
useEffect(() => {
    axios.get('/api/user')
        .then(res => setUser(res.data))
        .catch(() => setUser(null))
        .finally(() => setLoading(false));
}, []);

// 2. Login function
const login = async ({ email, password, setErrors }) => {
    try {
        // STEP 1: Get the CSRF Cookie first
        await axios.get('/sanctum/csrf-cookie');
        
        // STEP 2: Now attempt the login
        await axios.post('/login', { email, password });
        
        // STEP 3: Refresh user state
        const response = await axios.get('/api/user');
        setUser(response.data);
    } catch (error) {
        if (error.response?.status === 422) {
            setErrors(Object.values(error.response.data.errors).flat());
        } else {
            console.error("Login Error:", error);
        }
    }
};

// 3. Logout function
const logout = async () => {
    await axios.post('/logout');
    setUser(null);
    window.location.pathname = '/'; // Reset to login view
};

return { user, login, logout, loading };
};
