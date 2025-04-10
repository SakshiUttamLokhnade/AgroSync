// 
import './styles.css';
import { useForm } from 'react-hook-form';
import { useState } from 'react';

function Register() {
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setError,
    clearErrors,
  } = useForm();

  const [fileVerified, setFileVerified] = useState(false);
  const [fileName, setFileName] = useState('');
  const userType = watch('userType');
  const password = watch('password');

  const onFormSubmit = (data) => {
    if (userType === 'Farmer' && !fileVerified) {
      setError('utara', { type: 'manual', message: '7/12 Utara document verification failed' });
      return;
    }
    console.log('Form submitted:', data);
    alert('Form Submitted Successfully!');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    const fileReader = new FileReader();
    fileReader.onload = function (event) {
      const content = event.target.result.toLowerCase();
      if (content.includes('7/12') || content.includes('utara')) {
        setFileVerified(true);
        clearErrors('utara');
      } else {
        setFileVerified(false);
        setError('utara', { type: 'manual', message: 'Invalid 7/12 Utara document content' });
      }
    };

    fileReader.readAsText(file);
  };

  return (
    <div className="useform-container">
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <h2>REGISTER</h2>

        <div className="form-row">
          <div className="input-field">
            <label>User Type</label>
            <select {...register('userType', { required: true })}>
              <option value="">Select user type</option>
              <option value="Farmer">Farmer</option>
              <option value="Contractor">Contractor</option>
            </select>
            {errors.userType && <p>User type is required</p>}
          </div>

          <div className="input-field">
            <label>Fullname</label>
            <input
              type="text"
              {...register('fullname', { required: 'Fullname is required' })}
            />
            {errors.fullname && <p>{errors.fullname.message}</p>}
          </div>
        </div>

        <div className="form-row">
          <div className="input-field">
            <label>Contact Number</label>
            <input
              type="number"
              {...register('contact', { required: 'Contact number is required' })}
            />
            {errors.contact && <p>{errors.contact.message}</p>}
          </div>

          <div className="input-field">
            <label>Aadhar Number</label>
            <input
              type="number"
              {...register('aadhar', { required: 'Aadhar is required' })}
            />
            {errors.aadhar && <p>{errors.aadhar.message}</p>}
          </div>
        </div>

        {userType === 'Farmer' && (
          <>
            <div className="form-row">
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
            </div>

            <div className="form-row">
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

              <div className="input-field">
                <label>Land Area (in Acre)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="e.g., 2.5"
                  {...register('landArea', {
                    required: 'Land area is required for farmers',
                    min: { value: 0.1, message: 'Land area must be more than 0' },
                  })}
                />
                {errors.landArea && <p>{errors.landArea.message}</p>}
              </div>
            </div>

            <div className="input-field">
              <label>Upload 7/12 Utara (Text-based file)</label>
              <input
                type="file"
                accept=".txt,.doc,.docx"
                {...register('utara', { required: '7/12 Utara is required' })}
                onChange={handleFileUpload}
              />
              {fileName && <p>File uploaded: {fileName}</p>}
              {errors.utara && <p>{errors.utara.message}</p>}
              {fileVerified && <p style={{ color: 'green' }}>7/12 Utara document verified ✅</p>}
            </div>
          </>
        )}

        <div className="form-row">
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
        </div>

        <button type="submit">Register</button>
      </form>
    </div>
  );
}

export default Register;
