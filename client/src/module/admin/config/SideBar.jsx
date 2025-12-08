import React from "react";

const Sidebar = ({ categories, activeTab, setActiveTab }) => {
  return (
    <div className='card border-0 shadow-sm'>
      <div className='list-group list-group-flush'>
        {categories.map((cat) => (
          <button
            key={cat}
            className={`list-group-item list-group-item-action py-3 d-flex align-items-center justify-content-between ${
              activeTab === cat ? "active fw-bold" : ""
            }`}
            onClick={() => setActiveTab(cat)}
          >
            <span className='text-capitalize'>{cat} Settings</span>
            <i className='bi bi-chevron-right small'></i>
          </button>
        ))}
      </div>
    </div>
  );
};

export default Sidebar;
