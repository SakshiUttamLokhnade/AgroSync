import { useForm } from 'react-hook-form'
import './styles.css'
import { NavLink } from 'react-router-dom';

function Login (){

    const {
        register,
        handleSubmit,
        formState: { errors },
        watch
      } = useForm();
    
      const password = watch('password');
    
      //  const onFormSubmit = (data) => {
      //    console.log(data);
      // };

    return(

        <>
         <div className="login-container">
        <form >
        <div className="title">
          <h1>Login</h1>
        </div>

        <div className="input-field">
          <label htmlFor="">Username</label>
          <input type="email" {...register('userName',{
            required:"Username is required",pattern:{
                value:/^\S+@\S+$/i,
                message:"Please enter valid email address"
            }
          })}/>
          {errors.userName && <p>{errors.userName.message}</p>}
        </div>

        <div className="input-field">
          <label htmlFor="">Password</label>
          <input type="text" {...register('password',{
            required:"password is required",pattern:{
                value:6,
                message:"password length at least 6"
            }
          })}/>
          {errors.password && <p>{errors.password.message}</p>}
        </div>
        <div className="forgot-container">
            <p>
            <NavLink to="/forgot-password">Forgot Password</NavLink>
                
            </p>
        </div>
  
       
        <button type="submit">Login</button>
        <p>
            <NavLink to='/register'>Register Here</NavLink>
          </p>
        </form>
        </div>
         


        
        </>
    )
}
export default Login