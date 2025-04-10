
import { Route, Routes } from 'react-router-dom'
import './App.css'
import Dashboard from './Components/Dashboard'
import Login from './Components/Login'
import Home from './Components/Home'
import About from './Components/About'
import Features from './Components/Features'
import Register from './Components/Register'

function App() {
  

  return (
    <>
    <Routes>
      <Route path='/' Component={Dashboard}>
      <Route path='home' Component={Home}/>
      <Route path='about' Component={About}/>
      <Route path='features' Component={Features}/>
      <Route path='login' Component={Login}/>
      </Route>
      <Route path='/register' Component={Register}></Route>
    </Routes>
      
    </>
  )
}

export default App




