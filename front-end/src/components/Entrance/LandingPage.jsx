import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
const LandingPage = () => {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/auth/login');
  },);
  return (
    <div>LandingPage</div>
  )
}

export default LandingPage