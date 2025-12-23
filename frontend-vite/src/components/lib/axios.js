import Axios from 'axios';

const axios = Axios.create({
    baseURL: "http://localhost:8000",
    withCredentials: true, // This allows the browser to save the session cookie
    withXSRFToken: true,   // This tells Axios to look for the CSRF token in cookies
    headers: {
        'X-Requested-With': 'XMLHttpRequest',
        'Accept': 'application/json',
    },
});

export default axios;
