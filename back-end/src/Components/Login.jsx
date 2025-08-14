import React from 'react';
import { useForm } from 'react-hook-form';
import './styles.css';
import toast, { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import axios from 'axios';
import Loader from './Loader';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  
  // Redirect if already authenticated
  React.useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.userType === 'Farmer') {
          navigate(`/farmer/profile/${user.id}`, { replace: true });
        } else if (user.userType === 'Contractor') {
          navigate(`/contractor/profile/${user.id}`, { replace: true });
        }
      } catch (e) {
        // Invalid user data, clear and stay
        localStorage.removeItem('user');
      }
    }
  }, [navigate]);

  // Block history back navigation
  React.useEffect(() => {
    const handlePopState = (event) => {
      event.preventDefault();
      event.stopPropagation();
      // Prevent going back
      if (localStorage.getItem('user')) {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user.userType === 'Farmer') {
          navigate(`/farmer/profile/${user.id}`, { replace: true });
        } else if (user.userType === 'Contractor') {
          navigate(`/contractor/profile/${user.id}`, { replace: true });
        }
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [navigate]);

  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setLoading] = useState(false);

  const onSubmitForm = (data) => {
    setLoading(true);
  
    axios.post('http://localhost:8055/login', {
      userName: data.userName,
      password: data.password
    })
    .then(response => {
      const resData = response.data;
      setLoading(false);
  
      if (resData.status) {
        toast.success('Login successful!');

        if (resData.user) {
           localStorage.setItem('user', JSON.stringify(resData.user));
        } else {
           console.error("Login success response missing user object:", resData);
           toast.error('Login successful, but failed to retrieve user data.');
           return;
        }
        
        setTimeout(() => {
          if (resData.userType === 'Farmer') {
            const farmerIdToUse = resData.user?.id || resData.farmerId;
            console.log('Navigating to Farmer ID:', farmerIdToUse);
            if(farmerIdToUse) {
              navigate(`/farmer/profile/${farmerIdToUse}`, { replace: true });
            } else {
              console.error("Farmer ID missing for navigation");
              toast.error("Could not navigate to farmer profile.");
            }
          } else if (resData.userType === 'Contractor') {
            const contractorIdToUse = resData.user?.id || resData.contractorId;
            console.log("Navigating to Contractor ID:", contractorIdToUse);
            if(contractorIdToUse) {
              navigate(`/contractor/profile/${contractorIdToUse}`, { replace: true });
            } else {
              console.error("Contractor ID missing for navigation");
              toast.error("Could not navigate to contractor profile.");
            }
          } else {
            toast.error('Unknown user type!');
            navigate('/', { replace: true });
          }
        }, 500);
      } else {
        toast.error(resData.message || 'Invalid username or password');
      }
    })
    .catch(error => {
      setLoading(false);
      if (error.response && error.response.data && error.response.data.message) {
          toast.error(`Login failed: ${error.response.data.message}`);
      } else {
          toast.error('Login failed. Server error or network issue.');
      }
      console.error("Login error:", error.response || error);
    });
  };
  

  return (
    <>
      {isLoading && <Loader />}
      <div className="login-container">
        <form onSubmit={handleSubmit(onSubmitForm)}>
          <div className="title">
            <h1>Login</h1>
          </div>

          <div className="input-field">
            <label>Username</label>
            <input
              type="email"
              autoComplete='off'
              {...register('userName', {
                required: 'Username is required',
                pattern: {
                  value: /^\S+@\S+$/i,
                  message: 'Please enter a valid email address',
                },
              })}
            />
            {errors.userName && <p>{errors.userName.message}</p>}
          </div>

          <div className="input-field">
            <label>Password</label>
            <input
              type="password" 
              autoComplete='new-password'
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Minimum 6 characters required' },
              })}
            />
            {errors.password && <p>{errors.password.message}</p>}
          </div>

          <div className="forgot-container">
            <p>
              <NavLink to="/forgot-password">Forgot Password?</NavLink>
            </p>
          </div>

          <button type="submit">Login</button>

          <p>
            Don't have an account? <NavLink to="/register">Register Here</NavLink>
          </p>
        </form>
      </div>

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          duration: 5000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: 'green',
              secondary: 'black',
            },
          },
        }}
      />
    </>
  );
}
