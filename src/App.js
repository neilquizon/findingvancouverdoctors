import { useSelector } from "react-redux";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Spinner from "./components/Spinner";
import Admin from "./pages/Admin";
import BookAppointment from "./pages/BookAppointment";
import DoctorForm from "./pages/DoctorForm";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import About from "./pages/About";
import Contact from "./pages/Contact";
import ForgotPassword from "./pages/ForgotPassword";

function App() {
  const { loading } = useSelector((state) => state.loader);

  return (
    <div>
      {loading && <Spinner />}
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          
          <Route
            path="/book-appointment/:id"
            element={
              <ProtectedRoute>
                <BookAppointment />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/apply-doctor"
            element={
              <ProtectedRoute>
                <DoctorForm />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <Admin />
              </ProtectedRoute>
            }
          />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;
