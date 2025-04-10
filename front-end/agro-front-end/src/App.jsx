import { Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './Components/Dashboard'
import Login from './Components/Login'
import Home from './Components/Home'
import About from './Components/About'
import Features from './Components/Features'
import Register from './Components/Register' // Don't forget this import
import Forgot from './Components/Forgot'

function App() {
  return (
    <>
      <Routes>
        <Route path='/' element={<Dashboard />}>
          {/* 👇 This is the fix */}
          <Route index element={<Home />} />
          <Route path='home' element={<Home />} />
          <Route path='about' element={<About />} />
          <Route path='features' element={<Features />} />
          <Route path='login' element={<Login />} />
        </Route>

        <Route path='/register' element={<Register />} />
        <Route path='/forgot-password' element={<Forgot/>}/>
      </Routes>
    </>
  )
}

export default App
