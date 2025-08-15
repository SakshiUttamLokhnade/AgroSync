// // RegisteredFarm.jsx
// import React, { useEffect, useState } from 'react';
// import { useParams } from 'react-router-dom';
// import axios from 'axios';
// import toast, { Toaster } from 'react-hot-toast';

// const RegisteredFarm = () => {
//   const { farmerId } = useParams();
//   const [farms, setFarms] = useState([]);
//   const [formData, setFormData] = useState({});
//   const [isEditing, setIsEditing] = useState(false);
//   const [editId, setEditId] = useState(null);

//   useEffect(() => {
//     fetchFarms();
//   }, []);

//   const fetchFarms = async () => {
//     try {
//         const res = await axios.get(`https://agrosync-1.onrender.com/farms/${farmerId}`);
//       setFarms(res.data);
//     } catch (error) {
//       toast.error('Failed to fetch farms');
//     }
//   };

//   const handleInputChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleAddFarm = async () => {
//     try {
//       await axios.post('https://agrosync-1.onrender.com/farms/add', { ...formData, userId: farmerId });
//       toast.success('Farm added');
//       setFormData({});
//       fetchFarms();
//     } catch (error) {
//       toast.error('Failed to add farm');
//     }
//   };

//   const handleEditFarm = async () => {
//     try {
//       await axios.put(`https://agrosync-1.onrender.com/farms/${editId}`, formData);
//       toast.success('Farm updated');
//       setFormData({});
//       setIsEditing(false);
//       fetchFarms();
//     } catch (error) {
//       toast.error('Failed to update farm');
//     }
//   };

//   const handleDeleteFarm = async (id) => {
//     if (window.confirm('Delete this farm?')) {
//       try {
//         await axios.delete(`https://agrosync-1.onrender.com/farms/${id}`);
//         toast.success('Farm deleted');
//         fetchFarms();
//       } catch (error) {
//         toast.error('Failed to delete farm');
//       }
//     }
//   };

//   const handleEditClick = (farm) => {
//     setFormData(farm);
//     setEditId(farm.id);
//     setIsEditing(true);
//   };


//   useEffect(() => {
//     console.log('Farmer ID:', farmerId); // Debug: check if route param is working
//     fetchFarms();
//   }, [farmerId]);

  

//   return (
//     <div className="registered-farm">
//       <Toaster position="top-right" />
//       <h2>Registered Farms</h2>
//       <div className="farm-form">
//         <input name="soilType" placeholder="Soil Type" value={formData.soilType || ''} onChange={handleInputChange} />
//         <input name="waterSource" placeholder="Water Source" value={formData.waterSource || ''} onChange={handleInputChange} />
//         <input name="landArea" placeholder="Land Area" value={formData.landArea || ''} onChange={handleInputChange} />
//         <input name="locationAddress" placeholder="Location Address" value={formData.locationAddress || ''} onChange={handleInputChange} />
//         <input name="pincode" placeholder="Pincode" value={formData.pincode || ''} onChange={handleInputChange} />
//         <input name="preferredCrops" placeholder="Preferred Crops" value={formData.preferredCrops || ''} onChange={handleInputChange} />
//         {isEditing ? (
//           <button onClick={handleEditFarm}>Update Farm</button>
//         ) : (
//           <button onClick={handleAddFarm}>Add Farm</button>
//         )}
//       </div>

//       <div className="farm-list">
//       {farms.length === 0 ? (
//         <p>No farms registered yet.</p>
//       ) : (
//         farms.map((farm) => (
//           <div key={farm.id} className="farm-item">
//             <p><strong>Soil Type:</strong> {farm.soilType}</p>
//             <p><strong>Water Source:</strong> {farm.waterSource}</p>
//             <p><strong>Land Area:</strong> {farm.landArea} acres</p>
//             <p><strong>Location:</strong> {farm.locationAddress}</p>
//             <p><strong>Pincode:</strong> {farm.pincode}</p>
//             <p><strong>Preferred Crops:</strong> {farm.preferredCrops}</p>
//             <button onClick={() => handleEditClick(farm)}>Edit</button>
//             <button onClick={() => handleDeleteFarm(farm.id)}>Delete</button>
//           </div>
//         ))
//       )}
//     </div>
//     <li><Link to={`/farmer/registered-farms/${farmerId}`}>Registered Farms</Link></li>
//   </div>
// );
// };

// export default RegisteredFarm;


// RegisteredFarm.jsx
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';

const RegisteredFarm = () => {
  const { farmerId } = useParams();
  const [farms, setFarms] = useState([]);
  const [formData, setFormData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);

  useEffect(() => {
    if (farmerId) {
      fetchFarms();
    }
  }, [farmerId]);

  const fetchFarms = async () => {
    try {
      const res = await axios.get(`https://agrosync-1.onrender.com/farms/${farmerId}`);
      setFarms(res.data);
    } catch (error) {
      toast.error('Failed to fetch farms');
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleAddFarm = async () => {
    try {
      await axios.post('https://agrosync-1.onrender.com/farms/add', {
        ...formData,
        userId: farmerId,
      });
      toast.success('Farm added');
      setFormData({});
      fetchFarms();
    } catch (error) {
      toast.error('Failed to add farm');
    }
  };

  const handleEditFarm = async () => {
    try {
      await axios.put(`https://agrosync-1.onrender.com/farms/${editId}`, formData);
      toast.success('Farm updated');
      setFormData({});
      setIsEditing(false);
      fetchFarms();
    } catch (error) {
      toast.error('Failed to update farm');
    }
  };

  const handleDeleteFarm = async (id) => {
    if (window.confirm('Delete this farm?')) {
      try {
        await axios.delete(`https://agrosync-1.onrender.com/farms/${id}`);
        toast.success('Farm deleted');
        fetchFarms();
      } catch (error) {
        toast.error('Failed to delete farm');
      }
    }
  };

  const handleEditClick = (farm) => {
    setFormData(farm);
    setEditId(farm.id);
    setIsEditing(true);
  };

  return (
    <div className="registered-farm">
      <Toaster position="top-right" />
      <h2>Registered Farms</h2>

      <div className="farm-form">
        <input name="soilType" placeholder="Soil Type" value={formData.soilType || ''} onChange={handleInputChange} />
        <input name="waterSource" placeholder="Water Source" value={formData.waterSource || ''} onChange={handleInputChange} />
        <input name="landArea" placeholder="Land Area" value={formData.landArea || ''} onChange={handleInputChange} />
        <input name="locationAddress" placeholder="Location Address" value={formData.locationAddress || ''} onChange={handleInputChange} />
        <input name="pincode" placeholder="Pincode" value={formData.pincode || ''} onChange={handleInputChange} />
        <input name="preferredCrops" placeholder="Preferred Crops" value={formData.preferredCrops || ''} onChange={handleInputChange} />

        {isEditing ? (
          <button onClick={handleEditFarm}>Update Farm</button>
        ) : (
          <button onClick={handleAddFarm}>Add Farm</button>
        )}
      </div>

      <div className="farm-list">
        {farms.length === 0 ? (
          <p>No farms registered yet.</p>
        ) : (
          farms.map((farm) => (
            <div key={farm.id} className="farm-item">
              <p><strong>Soil Type:</strong> {farm.soilType}</p>
              <p><strong>Water Source:</strong> {farm.waterSource}</p>
              <p><strong>Land Area:</strong> {farm.landArea} acres</p>
              <p><strong>Location:</strong> {farm.locationAddress}</p>
              <p><strong>Pincode:</strong> {farm.pincode}</p>
              <p><strong>Preferred Crops:</strong> {farm.preferredCrops}</p>
              <button onClick={() => handleEditClick(farm)}>Edit</button>
              <button onClick={() => handleDeleteFarm(farm.id)}>Delete</button>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RegisteredFarm;
