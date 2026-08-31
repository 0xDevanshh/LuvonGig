'use client'
import React, { useState } from 'react';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
interface PeopleTabProps {
  onAddMember: () => void;
}
export function PeopleTab({
  onAddMember
}: PeopleTabProps) {
  const [expandedSection, setExpandedSection] = useState<'added' | 'pending' | null>('added');
  const toggleSection = (section: 'added' | 'pending') => {
    if (expandedSection === section) {
      setExpandedSection(null);
    } else {
      setExpandedSection(section);
    }
  };
  // Mock data for added members
  const addedMembers = [{
    id: '1',
    name: 'Micheal Jackson',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop'
  }, {
    id: '2',
    name: 'Micheal Jackson',
    avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?q=80&w=150&auto=format&fit=crop'
  }, {
    id: '3',
    name: 'Micheal Jackson',
    avatar: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?q=80&w=150&auto=format&fit=crop'
  }];
  // Mock data for pending members
  const pendingMembers = [{
    id: '4',
    name: 'Micheal Jackson',
    avatar: 'https://images.unsplash.com/photo-1568602471122-7832951cc4c5?q=80&w=150&auto=format&fit=crop'
  }];
  return <div className="flex flex-col h-full">
      {/* Search Bar */}
      <div className="p-4">
        <div className="relative">
          <input type="text" placeholder="Enter email to Add member..." className="w-full py-3 pl-4 pr-12 rounded-full border border-gray-200 focus:outline-none focus:ring-1 focus:ring-blue-500" onClick={onAddMember} />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 bg-green-500 rounded-full p-2">
            <Search size={18} className="text-white" />
          </div>
        </div>
      </div>
      {/* Added Section */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleSection('added')}>
          <h3 className="font-medium">Added</h3>
          {expandedSection === 'added' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {expandedSection === 'added' && <div className="space-y-4 px-4 pb-4">
            {addedMembers.map(member => <div key={member.id} className="flex items-center gap-3">
                <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-medium">{member.name}</h4>
                  <p className="text-sm text-gray-500">Added Recently</p>
                </div>
              </div>)}
          </div>}
      </div>
      {/* Pending Section */}
      <div>
        <div className="flex items-center justify-between p-4 cursor-pointer" onClick={() => toggleSection('pending')}>
          <h3 className="font-medium">Pending</h3>
          {expandedSection === 'pending' ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
        </div>
        {expandedSection === 'pending' && <div className="space-y-4 px-4 pb-4">
            {pendingMembers.map(member => <div key={member.id} className="flex items-center gap-3">
                <img src={member.avatar} alt={member.name} className="w-12 h-12 rounded-full object-cover" />
                <div>
                  <h4 className="font-medium">{member.name}</h4>
                  <p className="text-sm text-gray-500">Added Recently</p>
                </div>
              </div>)}
          </div>}
      </div>
    </div>;
}