import { Route, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './Components/Dashboard';
import Login from './Components/Login';
import Home from './Components/Home';
import About from './Components/About';
import Features from './Components/Features';
import Register from './Components/Register';
import FarmerProfile from './Components/FarmerProfile';
import FarmList from './Components/FarmList';
import Forgot from './Components/Forgot';
import FarmAvailable from './Components/FarmAvailable';
import ContractorProfile from './Components/ContractorProfile';
import FarmerDetails from './Components/FarmerDetails';
import ContactFarmer from './Components/ContactFarmer';
import RegisteredFarm from './Components/RegisteredFarm';  // Import RegisteredFarm
import Agreement from './Components/Agreement'; // Import the Agreement component
import AvailableContractors from './Components/AvailableContractors'; // Import AvailableContractors
import PrivateRoute from './Components/PrivateRoute';

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Dashboard />}>
          <Route index element={<Home />} />
          <Route path='home' element={<Home />} />
          <Route path='about' element={<About />} />
          <Route path='features' element={<Features />} />
          <Route path='login' element={<Login />} />
        </Route>

        <Route path='/register' element={<Register />} />
        <Route path='/farmAvailable' element={<FarmAvailable />} />
        <Route path='/dashboard' element={<Dashboard />} />
        <Route path='/contact-farmer' element={<ContactFarmer />} />
        
        {/* Dynamic route for FarmerProfile */}
        <Route path="/farmer/profile/:farmerId" element={
          <PrivateRoute>
            <FarmerProfile />
          </PrivateRoute>
        } />

        <Route path="/contractor/profile/:contractorId" element={
          <PrivateRoute>
            <ContractorProfile />
          </PrivateRoute>
        } />

        <Route path="/farmer/details/:farmerId" element={
          <PrivateRoute>
            <FarmerDetails />
          </PrivateRoute>
        } />

        <Route path='/farmList' element={<FarmList />} />
        <Route path='/forgot-password' element={<Forgot />} />
        
        {/* Add the route for RegisteredFarm */}
        <Route path="/farmer/registered-farms/:farmerId" element={
          <PrivateRoute>
            <RegisteredFarm />
          </PrivateRoute>
        } />
        
        {/* Route for the Agreement component */}
        <Route path="/agreement" element={
          <PrivateRoute>
            <Agreement />
          </PrivateRoute>
        } />

        {/* Route for Available Contractors */}
        <Route path="/available-contractors" element={
          <PrivateRoute>
            <AvailableContractors />
          </PrivateRoute>
        } />

      </Routes>
    </>
  );
}

export default App;
