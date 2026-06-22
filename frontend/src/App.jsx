import { Routes, Route, Link, useLocation } from "react-router-dom";
import Trainer from "./pages/Trainer";
import Membership from "./pages/Membership";
import "./App.css";

function App() {
  const location = useLocation();

  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-container">
          <div className="nav-brand"> GymPro</div>
          <ul className="nav-links">
            <li>
              <Link
                to="/"
                className={location.pathname === "/" ? "nav-link active" : "nav-link"}
              >
              Trainer Management
              </Link>
            </li>
            <li>
              <Link
                to="/membership"
                className={location.pathname === "/membership" ? "nav-link active" : "nav-link"}
              >
                Membership Plans
              </Link>
            </li>
          </ul>
        </div>
      </nav>

      <Routes>
        <Route path="/" element={<Trainer />} />
        <Route path="/membership" element={<Membership />} />
      </Routes>
    </div>
  );
}

export default App;