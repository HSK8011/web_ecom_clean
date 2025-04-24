import React, { useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTimes } from '@fortawesome/free-solid-svg-icons';

const PromoBar = () => {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div className="bg-black text-white py-2 position-relative">
      <div className="container text-center">
        Sign up and get 20% off to your first order. 
        <a href="#" className="text-white text-decoration-underline ms-2">Sign Up Now</a>
      </div>
      <button 
        className="btn btn-link text-white position-absolute end-0 top-50 translate-middle-y"
        onClick={() => setIsVisible(false)}
        style={{ marginRight: '1rem' }}
      >
        <FontAwesomeIcon icon={faTimes} />
      </button>
    </div>
  );
};

export default PromoBar; 