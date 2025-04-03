import { Route, Routes } from "react-router-dom";
import HomePage from "./pages/HomePage.jsx";

function App() {
  return (
    <div>
      <Routes>
        <Route path="/" element={<HomePage />} /> 
        <Route path="/signup" element={<SignUpPage />} /> 
        <Route path="/login" element={<LoginPage />} /> 
      </Routes>
    </div>
  )
}

export default App