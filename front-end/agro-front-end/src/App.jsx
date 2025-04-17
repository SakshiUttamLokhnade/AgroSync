import { Route, Routes } from 'react-router-dom';
import './App.css';
import Dashboard from './Components/Dashboard';
import Login from './Components/Login';
import Home from './Components/Home';
import About from './Components/About';
import Features from './Components/Features';
import Register from './Components/Register';
import FarmerProfile from './Components/FarmerProfile'
import FarmList from './Components/FarmList';
import Forgot from './Components/Forgot';
import FarmAvailable from './Components/FarmAvailable'

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
        
        {/* Dynamic route for FarmerProfile */}
        <Route path="/farmer/profile/:farmerId" element={<FarmerProfile />}/>

        
        <Route path='/farmList' element={<FarmList />} />
        <Route path='/forgot-password' element={<Forgot />} />
      </Routes>
    </>
  );
}

export default App;
