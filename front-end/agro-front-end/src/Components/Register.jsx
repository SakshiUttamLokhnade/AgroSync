// 

import './styles.css'
import { useForm } from 'react-hook-form';

function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm();

  const userType = watch('userType');
  const password = watch('password');

  const onFormSubmit = (data) => {
    console.log(data);
  };

  return (
    <div className="useform-container">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <h2>REGISTER</h2>

        {/* User Type */}
        <div className="input-field">
          <label>User Type</label>
          <select {...register('userType', { required: true })}>
            <option value="">Select user type</option>
            <option value="Farmer">Farmer</option>
            <option value="Contractor">Contractor</option>
          </select>
          {errors.userType && <p>User type is required</p>}
        </div>

        {/* Full Name */}
        <div className="input-field">
          <label>Fullname</label>
          <input
            type="text"
            {...register('fullname', { required: 'Fullname is required' })}
          />
          {errors.fullname && <p>{errors.fullname.message}</p>}
        </div>

        {/* Contact */}
        <div className="input-field">
          <label>Contact Number</label>
          <input
            type="number"
            {...register('contact', { required: 'Contact number is required' })}
          />
          {errors.contact && <p>{errors.contact.message}</p>}
        </div>

        {/* Aadhar */}
        <div className="input-field">
          <label>Aadhar Number</label>
          <input
            type="number"
            {...register('aadhar', { required: 'Aadhar is required' })}
          />
          {errors.aadhar && <p>{errors.aadhar.message}</p>}
        </div>

        {/* Conditionally show fields only for Farmers */}
        {userType === 'Farmer' && (
          <>
            <div className="input-field">
              <label>Geo Tag Location</label>
              <input
                type="text"
                placeholder="Enter geo location"
                {...register('geoLocation', {
                  required: 'Geo location is required for farmers',
                })}
              />
              {errors.geoLocation && <p>{errors.geoLocation.message}</p>}
            </div>

            <div className="input-field">
              <label>Soil Type</label>
              <input
                type="text"
                placeholder="e.g., Clay, Loam, Sandy"
                {...register('soilType', {
                  required: 'Soil type is required for farmers',
                })}
              />
              {errors.soilType && <p>{errors.soilType.message}</p>}
            </div>

            <div className="input-field">
              <label>Water Source</label>
              <select
                {...register('waterSource', {
                  required: 'Water source is required for farmers',
                })}
              >
                <option value="">Select water source</option>
                <option value="Well">Well</option>
                <option value="Tank">Tank</option>
                <option value="Tube Well">Tube Well</option>
              </select>
              {errors.waterSource && <p>{errors.waterSource.message}</p>}
            </div>
          </>
        )}

        {/* Password */}
        <div className="input-field">
          <label>Password</label>
          <input
            type="password"
            {...register('password', {
              required: 'Password is required.',
              minLength: {
                value: 6,
                message: 'Password length should be at least 6',
              },
            })}
          />
          {errors.password && <p>{errors.password.message}</p>}
        </div>

        {/* Confirm Password */}
        <div className="input-field">
          <label>Confirm Password</label>
          <input
            type="password"
            {...register('cnf', {
              validate: (value) => value === password || 'Passwords do not match',
            })}
          />
          {errors.cnf && <p>{errors.cnf.message}</p>}
        </div>

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
