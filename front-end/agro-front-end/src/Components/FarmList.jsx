// // FarmList.js
// import './styles.css';

// export default function FarmList({ farmers, onContact }) {
//   return (
//     <div className="farmers-grid">
//       {farmers.map((farmer, index) => (
//         <div key={index} className="farmer-card">
//           <div className="farmer-image">
//             <img
//               src={
//                 farmer.land_image_path
//                   ? `https://agrosync-1.onrender.com/uploads/${farmer.land_image_path}`
//                   : 'https://via.placeholder.com/150'
//               }
//               alt="Land"
//             />
//           </div>
//           <div className="farmer-info">
//             <h2>{farmer.fullName}</h2>
//             <p><strong>Location:</strong> {farmer.locationAddress}</p>
//             <p><strong>Land Area:</strong> {farmer.landArea} acres</p>
//             <p><strong>Preferred Crop:</strong> {farmer.preferredCrops ? farmer.preferredCrops : 'No crops specified'}</p>
//             {onContact && (
//               <button className="contact-button" onClick={() => onContact(farmer)}>
//                 Contact Farmer
//               </button>
//             )}
//           </div>
//         </div>
//       ))}
//     </div>
//   );
// }


// FarmList.js
import './styles.css';

export default function FarmList({ farmers, onContact }) {
  return (
    <div className="farmers-grid">
      {farmers.map((farmer, index) => (
        <div key={index} className="farmer-card">
          <div className="farmer-image">
            <img
              src={
                farmer.land_image_path
                  ? `https://agrosync-1.onrender.com/uploads/${farmer.land_image_path}`
                  : 'https://via.placeholder.com/150'
              }
              alt="Land"
            />
          </div>
          <div className="farmer-info">
            <h2>{farmer.fullName}</h2>
            <p><strong>Location:</strong> {farmer.locationAddress}</p>
            <p><strong>Land Area:</strong> {farmer.landArea} acres</p>
            <p><strong>Preferred Crop:</strong> {farmer.preferredCrops || 'No crops specified'}</p>

            {onContact && (
              <button className="contact-button" onClick={() => onContact(farmer)}>
                Contact Farmer
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
