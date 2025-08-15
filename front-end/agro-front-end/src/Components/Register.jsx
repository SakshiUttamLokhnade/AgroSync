



// import './styles.css'
// import { useForm } from 'react-hook-form';
// import { useState } from 'react';
// import axios from 'axios';
// import toast, { Toaster } from 'react-hot-toast';
// import { useNavigate } from 'react-router-dom';
// import Loader from './Loader';

// function Register() {
//   const {
//     register,
//     handleSubmit,
//     formState: { errors },
//     watch,
//     setError,
//     clearErrors,
//   } = useForm();

//   const [fileVerified, setFileVerified] = useState(false);
//   const [fileName, setFileName] = useState('');
//   const [landImagePreview, setLandImagePreview] = useState('');
//   const [isLoading, setIsLoading] = useState(false);
//   const navigate = useNavigate();

//   const [selectedCrops, setSelectedCrops] = useState([]);


//   const userType = watch('userType');
//   const password = watch('password');


//   const handleCropSelection = (e) => {
//     const value = e.target.value;
//     setSelectedCrops((prev) =>
//       prev.includes(value) ? prev.filter((crop) => crop !== value) : [...prev, value]
//     );
//   };
  

//   const onFormSubmit = async (data) => {
//     // ... (existing validation checks)
  
//     try {
//       setIsLoading(true);
//       const formData = new FormData();
  
//       // Append all fields
//       formData.append('fullName', data.fullName);
//       formData.append('userName', data.userName);
//       formData.append('userType', data.userType);
//       formData.append('contact', data.contact);
//       formData.append('aadhar', data.aadhar);
//       formData.append('password', data.password);
  
//       if (data.userType === 'Farmer') {
//         formData.append('soilType', data.soilType);
//         formData.append('waterSource', data.waterSource);
//         formData.append('landArea', data.landArea);
//         formData.append('locationAddress', data.locationAddress);
//         formData.append('pincode', data.pincode);
//         formData.append('preferredCrops', data.preferredCrops); // Ensure this is appended
//         formData.append('utara', data.utara[0]);
//         formData.append('landImage', data.landImage[0]);
//       }
  
//       const res = await axios.post('http://localhost:8055/register', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
  
//       // ... (rest of the code)
//     } catch (error) {
//       // ... (error handling)
//     }
//   };

//       if (res.data.status) {
//         toast.success('Registered successfully!');
//         setTimeout(() => {
//           setIsLoading(false);
//           navigate('/login'); // Redirect to login after 1.5s
//         }, 1500);
//       } else {
//         setIsLoading(false);
//         toast.error(res.data.message || 'Registration failed');
//       }
//     } catch (error) {
//       setIsLoading(false);
//       toast.error('Server error during registration');
//       console.error(error);
//     }
//   };

//   const handlePDFUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     setFileName(file.name);

//     if (file.type === 'application/pdf') {
//       setFileVerified(true);
//       clearErrors('utara');
//     } else {
//       setFileVerified(false);
//       setError('utara', {
//         type: 'manual',
//         message: 'Only PDF files are allowed for 7/12 Utara',
//       });
//     }
//   };

//   const handleLandImageUpload = (e) => {
//     const file = e.target.files[0];
//     if (!file) return;

//     if (!file.type.startsWith('image/')) {
//       setError('landImage', {
//         type: 'manual',
//         message: 'Only image files are allowed',
//       });
//       return;
//     }

//     clearErrors('landImage');

//     const reader = new FileReader();
//     reader.onloadend = () => {
//       setLandImagePreview(reader.result);
//     };
//     reader.readAsDataURL(file);
//   };

//   return (
//     <>
//       {isLoading && <Loader />}
//       <div className="useform-container">
//         <form onSubmit={handleSubmit(onFormSubmit)}>
//           <h2>REGISTER</h2>

//           {/* User Type & Fullname */}
//           <div className="form-row">
//             <div className="input-field">
//               <label>User Type</label>
//               <select {...register('userType', { required: 'User type is required' })}>
//                 <option value="">Select user type</option>
//                 <option value="Farmer">Farmer</option>
//                 <option value="Contractor">Contractor</option>
//               </select>
//               {errors.userType && <p>{errors.userType.message}</p>}
//             </div>

//             <div className="input-field">
//               <label>Fullname</label>
//               <input
//                 type="text"
//                 {...register('fullName', { required: 'Fullname is required' })}
//               />
//               {errors.fullName && <p>{errors.fullName.message}</p>}
//             </div>
//           </div>

//           {/* User Name & Contact */}
//           <div className="form-row">
//             <div className="input-field">
//               <label>Username</label>
//               <input
//                 type="email"
//                 {...register('userName', {
//                   required: 'Username is required',
//                   pattern: {
//                     value: /^\S+@\S+$/i,
//                     message: 'Please enter a valid email address',
//                   },
//                 })}
//               />
//               {errors.userName && <p>{errors.userName.message}</p>}
//             </div>

//             <div className="input-field">
//               <label>Contact Number</label>
//               <input
//                 type="number"
//                 {...register('contact', { required: 'Contact number is required' })}
//               />
//               {errors.contact && <p>{errors.contact.message}</p>}
//             </div>
//           </div>

//           {/* Aadhar */}
//           <div className="form-row">
//             <div className="input-field">
//               <label>Aadhar Number</label>
//               <input
//                 type="number"
//                 {...register('aadhar', { required: 'Aadhar is required' })}
//               />
//               {errors.aadhar && <p>{errors.aadhar.message}</p>}
//             </div>
//           </div>

//           {/* Farmer Fields */}
//           {userType === 'Farmer' && (
//             <>
//               <div className="form-row">
//                 <div className="input-field">
//                   <label>Soil Type</label>
//                   <input
//                     type="text"
//                     placeholder="e.g., Clay, Loam, Sandy"
//                     {...register('soilType', { required: 'Soil type is required' })}
//                   />
//                   {errors.soilType && <p>{errors.soilType.message}</p>}
//                 </div>

//                 <div className="input-field">
//                   <label>Water Source</label>
//                   <select {...register('waterSource', { required: 'Water source is required' })}>
//                     <option value="">Select water source</option>
//                     <option value="Well">Well</option>
//                     <option value="Tank">Tank</option>
//                     <option value="Tube Well">Tube Well</option>
//                   </select>
//                   {errors.waterSource && <p>{errors.waterSource.message}</p>}
//                 </div>
//               </div>

//               <div className="form-row">
//                 <div className="input-field">
//                   <label>Land Area (in Acre)</label>
//                   <input
//                     type="number"
//                     step="0.01"
//                     placeholder="e.g., 2.5"
//                     {...register('landArea', {
//                       required: 'Land area is required for farmers',
//                       min: { value: 0.1, message: 'Land area must be more than 0' },
//                     })}
//                   />
//                   {errors.landArea && <p>{errors.landArea.message}</p>}
//                 </div>

//                 <div className="input-field">
//                   <label>Location Address</label>
//                   <input
//                     type="text"
//                     placeholder="e.g., Village, Taluka, District"
//                     {...register('locationAddress', { required: 'Location address is required' })}
//                   />
//                   {errors.locationAddress && <p>{errors.locationAddress.message}</p>}
//                 </div>
//               </div>

//               <div className="input-field">
//                   <label>Pin Code</label>
//                   <input
//                     type="text"
                    
//                     {...register('pincode', { required: 'Pincode is required' })}
//                   />
//                   {errors.pincode && <p>{errors.pincode.message}</p>}
//                 </div>


//               <div className="input-field">
//                 <label>Upload 7/12 Utara (PDF only)</label>
//                 <input
//                   type="file"
//                   accept="application/pdf"
//                   {...register('utara', { required: '7/12 Utara is required' })}
//                   onChange={handlePDFUpload}
//                 />
//                 {fileName && <p>File uploaded: {fileName}</p>}
//                 {errors.utara && <p>{errors.utara.message}</p>}
//                 {fileVerified && (
//                   <p style={{ color: 'green' }}>7/12 Utara document verified ✅</p>
//                 )}
//               </div>

//               <div className="input-field">
//                 <label>Upload Land Image</label>
//                 <input
//                   type="file"
//                   accept="image/*"
//                   {...register('landImage', { required: 'Land image is required' })}
//                   onChange={handleLandImageUpload}
//                 />
//                 {errors.landImage && <p>{errors.landImage.message}</p>}
//                 {landImagePreview && (
//                   <img
//                     src={landImagePreview}
//                     alt="Land Preview"
//                     style={{ marginTop: '10px', maxWidth: '200px', borderRadius: '10px' }}
//                   />
//                 )}
//               </div>

//               <div className="input-field">
//   <label>Preferred Crops</label>
//   <input
//     type="text"
//     placeholder="e.g., Wheat, Soybean, Cotton"
//     {...register('preferredCrops', { required: 'Preferred crops are required' })}
//   />
//   {errors.preferredCrops && <p>{errors.preferredCrops.message}</p>}
// </div>

//             </>
//           )}

//           {/* Password and Confirm Password */}
//           <div className="form-row">
//             <div className="input-field">
//               <label>Password</label>
//               <input
//                 type="password"
//                 {...register('password', {
//                   required: 'Password is required',
//                   minLength: { value: 6, message: 'Password length should be at least 6' },
//                 })}
//               />
//               {errors.password && <p>{errors.password.message}</p>}
//             </div>

//             <div className="input-field">
//               <label>Confirm Password</label>
//               <input
//                 type="password"
//                 {...register('cnf', {
//                   validate: (value) => value === password || 'Passwords do not match',
//                 })}
//               />
//               {errors.cnf && <p>{errors.cnf.message}</p>}
//             </div>
//           </div>

//           <button type="submit">Register</button>
//         </form>
//       </div>

//       <Toaster
//         position="top-center"
//         reverseOrder={false}
//         toastOptions={{
//           duration: 5000,
//           style: {
//             background: '#363636',
//             color: '#fff',
//           },
//           success: {
//             duration: 3000,
//             iconTheme: {
//               primary: 'green',
//               secondary: 'black',
//             },
//           },
//         }}
//       />
//     </>
//   );
// }

// export default Register;


import './styles.css';
import { useForm } from 'react-hook-form';
import { useState } from 'react';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import Loader from './Loader';

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
  const [landImagePreview, setLandImagePreview] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const userType = watch('userType');
  const password = watch('password');

  const onFormSubmit = async (data) => {
    if (userType === 'Farmer' && !fileVerified) {
      setError('utara', {
        type: 'manual',
        message: '7/12 Utara document verification failed',
      });
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();

      // Append all fields
      formData.append('fullName', data.fullName);
      formData.append('userName', data.userName);
      formData.append('userType', data.userType);
      formData.append('contact', data.contact);
      formData.append('aadhar', data.aadhar);
      formData.append('password', data.password);

      if (data.userType === 'Farmer') {
        formData.append('soilType', data.soilType);
        formData.append('waterSource', data.waterSource);
        formData.append('landArea', data.landArea);
        formData.append('locationAddress', data.locationAddress);
        formData.append('pincode', data.pincode);
        formData.append('preferredCrops', data.preferredCrops);
        formData.append('utara', data.utara[0]);
        formData.append('landImage', data.landImage[0]);
      }

      const res = await axios.post('http://localhost:8055/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (res.data.status) {
        toast.success('Registered successfully!');
        setTimeout(() => {
          setIsLoading(false);
          navigate('/login');
        }, 1500);
      } else {
        setIsLoading(false);
        toast.error(res.data.message || 'Registration failed');
      }
    } catch (error) {
      setIsLoading(false);
      toast.error('Server error during registration');
      console.error(error);
    }
  };

  const handlePDFUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);

    if (file.type === 'application/pdf') {
      setFileVerified(true);
      clearErrors('utara');
    } else {
      setFileVerified(false);
      setError('utara', {
        type: 'manual',
        message: 'Only PDF files are allowed for 7/12 Utara',
      });
    }
  };

  const handleLandImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('landImage', {
        type: 'manual',
        message: 'Only image files are allowed',
      });
      return;
    }

    clearErrors('landImage');

    const reader = new FileReader();
    reader.onloadend = () => {
      setLandImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      {isLoading && <Loader />}
      <div className="useform-container">
        <form onSubmit={handleSubmit(onFormSubmit)}>
          <h2>REGISTER</h2>

          {/* User Type & Fullname */}
          <div className="form-row">
            <div className="input-field">
              <label>User Type</label>
              <select {...register('userType', { required: 'User type is required' })}>
                <option value="">Select user type</option>
                <option value="Farmer">Farmer</option>
                <option value="Contractor">Contractor</option>
              </select>
              {errors.userType && <p>{errors.userType.message}</p>}
            </div>

            <div className="input-field">
              <label>Fullname</label>
              <input
                type="text"
                {...register('fullName', { required: 'Fullname is required' })}
              />
              {errors.fullName && <p>{errors.fullName.message}</p>}
            </div>
          </div>

          {/* User Name & Contact */}
          <div className="form-row">
            <div className="input-field">
              <label>Username</label>
              <input
                type="email"
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
              <label>Contact Number</label>
              <input
                type="number"
                {...register('contact', { required: 'Contact number is required' })}
              />
              {errors.contact && <p>{errors.contact.message}</p>}
            </div>
          </div>

          {/* Aadhar */}
          <div className="form-row">
            <div className="input-field">
              <label>Aadhar Number</label>
              <input
                type="number"
                {...register('aadhar', { required: 'Aadhar is required' })}
              />
              {errors.aadhar && <p>{errors.aadhar.message}</p>}
            </div>
          </div>

          {/* Farmer Fields */}
          {userType === 'Farmer' && (
            <>
              <div className="form-row">
                <div className="input-field">
                  <label>Soil Type</label>
                  <input
                    type="text"
                    placeholder="e.g., Clay, Loam, Sandy"
                    {...register('soilType', { required: 'Soil type is required' })}
                  />
                  {errors.soilType && <p>{errors.soilType.message}</p>}
                </div>

                <div className="input-field">
                  <label>Water Source</label>
                  <select {...register('waterSource', { required: 'Water source is required' })}>
                    <option value="">Select water source</option>
                    <option value="Well">Well</option>
                    <option value="Tank">Tank</option>
                    <option value="Tube Well">Tube Well</option>
                  </select>
                  {errors.waterSource && <p>{errors.waterSource.message}</p>}
                </div>
              </div>

              <div className="form-row">
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

                <div className="input-field">
                  <label>Location Address</label>
                  <input
                    type="text"
                    placeholder="e.g., Village, Taluka, District"
                    {...register('locationAddress', { required: 'Location address is required' })}
                  />
                  {errors.locationAddress && <p>{errors.locationAddress.message}</p>}
                </div>
              </div>

              <div className="input-field">
                <label>Pin Code</label>
                <input
                  type="text"
                  {...register('pincode', { required: 'Pincode is required' })}
                />
                {errors.pincode && <p>{errors.pincode.message}</p>}
              </div>

              <div className="input-field">
                <label>Upload 7/12 Utara (PDF only)</label>
                <input
                  type="file"
                  accept="application/pdf"
                  {...register('utara', { required: '7/12 Utara is required' })}
                  onChange={handlePDFUpload}
                />
                {fileName && <p>File uploaded: {fileName}</p>}
                {errors.utara && <p>{errors.utara.message}</p>}
                {fileVerified && (
                  <p style={{ color: 'green' }}>7/12 Utara document verified ✅</p>
                )}
              </div>

              <div className="input-field">
                <label>Upload Land Image</label>
                <input
                  type="file"
                  accept="image/*"
                  {...register('landImage', { required: 'Land image is required' })}
                  onChange={handleLandImageUpload}
                />
                {errors.landImage && <p>{errors.landImage.message}</p>}
                {landImagePreview && (
                  <img
                    src={landImagePreview}
                    alt="Land Preview"
                    style={{ marginTop: '10px', maxWidth: '200px', borderRadius: '10px' }}
                  />
                )}
              </div>

              <div className="input-field">
                <label>Preferred Crops</label>
                <input
                  type="text"
                  placeholder="e.g., Wheat, Soybean, Cotton"
                  {...register('preferredCrops', { required: 'Preferred crops are required' })}
                />
                {errors.preferredCrops && <p>{errors.preferredCrops.message}</p>}
              </div>
            </>
          )}

          {/* Password and Confirm Password */}
          <div className="form-row">
            <div className="input-field">
              <label>Password</label>
              <input
                type="password"
                {...register('password', {
                  required: 'Password is required',
                  minLength: { value: 6, message: 'Password length should be at least 6' },
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

export default Register;