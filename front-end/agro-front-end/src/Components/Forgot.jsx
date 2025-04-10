import { useForm } from 'react-hook-form';
import { NavLink } from 'react-router-dom';
import './styles.css';

export default function Forgot() {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm();

  const onSubmit = (data) => {
    console.log('Password reset requested for:', data.email);
    // Add your password reset logic here
  };

  return (
    <div className="forgot-container">
      <form onSubmit={handleSubmit(onSubmit)}>
        <div className="title">
          <h1>Reset Password</h1>
        </div>

        <div className="input-field">
          <label>Email</label>
          <input
            type="email"
            {...register('email', {
              required: "Email is required",
              pattern: {
                value: /^\S+@\S+$/i,
                message: "Please enter a valid email address"
              }
            })}
          />
          {errors.email && <p className="error">{errors.email.message}</p>}
        </div>

        <button type="submit">Send Reset Link</button>

        <div className="back-to-login">
          <NavLink to="/login">Back to Login</NavLink>
        </div>
      </form>
    </div>
  );
}
