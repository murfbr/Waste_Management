// src/components/app/admin/AdminCard.jsx
import React from 'react';

export default function AdminCard({ icon, title, description, children, className = '' }) {
    return (
        <div className={`bg-white rounded-lg shadow-md overflow-hidden flex flex-col ${className}`}>
            <div className="p-5 bg-blue-coral flex items-center space-x-4">
                <div className="flex-shrink-0 bg-white/20 p-3 rounded-full">{icon}</div>
                <div>
                    <h3 className="text-xl font-lexend font-bold text-white">{title}</h3>
                    <p className="text-sm text-white/80 font-comfortaa">{description}</p>
                </div>
            </div>
            <div className="p-6 flex-grow">{children}</div>
        </div>
    );
}