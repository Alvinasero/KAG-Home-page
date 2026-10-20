'use client';

import React from 'react';
import Link from 'next/link';

interface MinistryProps {
  name: string;
  description: string;
  leader: string;
  icon: React.ReactNode;
}

const MinistryCard: React.FC<MinistryProps> = ({
  name,
  description,
  leader,
  icon,
}) => {
  return (
    <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 hover:shadow-xl transition-all duration-300 group">
      <div className="w-14 h-14 bg-blue-900 text-yellow-400 rounded-lg flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
        {icon}
      </div>

      <h3 className="text-2xl font-bold text-blue-900 mb-2">
        {name}
      </h3>

      <p className="text-blue-500 text-sm font-semibold mb-4 uppercase tracking-wider">
        Leader: {leader}
      </p>

      <p className="text-gray-600 text-sm leading-relaxed mb-6">
        {description}
      </p>

      <Link
        href={`/ministries/${name.toLowerCase().replace(/\s+/g, '-')}`}
        className="text-yellow-500 font-bold text-sm flex items-center gap-2 group-hover:gap-4 transition-all"
      >
        Learn More <span>&rarr;</span>
      </Link>
    </div>
  );
};

export default MinistryCard;