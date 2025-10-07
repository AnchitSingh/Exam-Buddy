import React, { useState, useEffect, useRef } from 'react';

const CustomDropdown = ({ label, options, value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Handle clicking outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleOptionClick = (optionValue) => {
    onChange(optionValue); // Call the parent's state update function
    setIsOpen(false);     // Close the dropdown
  };

  const toggleDropdown = () => setIsOpen(!isOpen);
  
  const selectedOptionLabel = value;

  return (
    <div>
      {label && <label className="text-sm font-medium text-slate-700 mb-1 block">{label}</label>}
      <div className="relative" ref={dropdownRef}>
        {/* Dropdown Toggle */}
        <button
          type="button"
          onClick={toggleDropdown}
          className={`w-full flex justify-between items-center px-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-sm hover:shadow-md transition-all duration-200 text-left ${
            isOpen ? 'ring-2 ring-amber-500' : ''
          }`}
        >
          <span className="text-slate-800">{selectedOptionLabel}</span>
          <svg
            className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path>
          </svg>
        </button>

        {/* Dropdown Menu with Animation */}
        <div
          className={`absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl border border-slate-200 z-30 overflow-hidden transition-all duration-200 ease-out ${
            isOpen ? 'opacity-100 scale-100' : 'opacity-0 scale-95 pointer-events-none'
          }`}
          style={{ transformOrigin: 'top' }}
        >
          <ul className="p-2 max-h-60 overflow-y-auto">
            {options.map((option) => (
              <li
                key={option}
                onClick={() => handleOptionClick(option)}
                className="px-4 py-2 text-slate-700 rounded-md hover:bg-amber-50 hover:text-amber-800 cursor-pointer transition-colors"
              >
                {option}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CustomDropdown;