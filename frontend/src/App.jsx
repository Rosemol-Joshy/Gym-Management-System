import { Routes, Route, Link } from "react-router-dom";
import Trainer from "./pages/Trainer";
import Membership from "./pages/Membership";

function App() {
  return (
    <div>
      <nav style={{ padding: "10px", background: "#ddd" }}>
        <Link to="/">Trainer</Link> |{" "}
        <Link to="/membership">Membership</Link>
      </nav>

      <Routes>
        <Route path="/" element={<Trainer />} />
        <Route path="/membership" element={<Membership />} />
      </Routes>
    </div>
  );
}

export default App;