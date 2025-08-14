import { NavLink, Outlet } from 'react-router-dom'
import './styles.css'

function Dashboard(){


    return(
        <>
         <div className="header">
            <h2>AgroSync</h2>
            <div className="links">
                <NavLink to= 'home'>Home</NavLink>
                <NavLink to= 'about'>About Us</NavLink>
                <NavLink to= 'features'>Features</NavLink>
                <NavLink to= 'login'>Login</NavLink>
            </div>
        </div>
        <div className="outlet-container">
            <Outlet> </Outlet>
        </div>

        
        
        </>
    )
}
export default Dashboard