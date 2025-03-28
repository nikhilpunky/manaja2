import { useEffect } from "react";
import { useLocation } from "wouter";

// Redirect to login page with register tab active
const Register = () => {
  const [, navigate] = useLocation();

  useEffect(() => {
    // Simply redirect to login page with register tab pre-selected
    navigate("/login?tab=register");
  }, [navigate]);

  return null;
};

export default Register;
