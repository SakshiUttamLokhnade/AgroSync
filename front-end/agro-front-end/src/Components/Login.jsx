


import { useForm } from 'react-hook-form';
import './styles.css';
import toast, { Toaster } from 'react-hot-toast';
import { useState } from 'react';
import axios from 'axios';
import Loader from './Loader';
import { NavLink, useNavigate } from 'react-router-dom';

export default function Login() {
  const { register, handleSubmit, formState: { errors } } = useForm();
  const [isLoading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onSubmitForm = (data) => {
    setLoading(true);
  
    setTimeout(async () => {
      try {
        const response = await axios.post('http://localhost:8055/login', {
          userName: data.userName,
          password: data.password
        });
        const resData = response.data;
  
        setLoading(false);
  
        if (resData.status) {
          toast.success('Login successful!');

          if (response.data.success) {
            localStorage.setItem('isLoggedIn', 'true');
            localStorage.setItem('user', JSON.stringify(response.data.user)); // optional
            window.location.href = '/'; // go back to home/dashboard
          }
          
  
          // Redirect based on userType
          setTimeout(() => {
            if (resData.userType === 'Farmer') {
              console.log('Farmer ID:', resData.farmerId);
              navigate(`/farmer/profile/${resData.farmerId}`); // Corrected the syntax here
            } else if (resData.userType === 'Contractor') {
              navigate('/farmAvailable');
            } else {
              toast.error('Unknown user type!');
            }
          }, 1000);
        } else {
          toast.error(resData.message || 'Invalid username or password');
        }
      } catch (error) {
        setLoading(false);
        toast.error('Server error or network issue!');
        console.error(error);
      }
    }, 1500);
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
