import React from 'react';

interface CreateHackathonOverviewProps {
  hackathonData: any;
  updateHackathonData: (data: any) => void;
}

const CreateHackathonOverview: React.FC<CreateHackathonOverviewProps> = ({ hackathonData, updateHackathonData }) => {
  const handleInputChange = (field: string, value: any) => {
    updateHackathonData({ [field]: value });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Hackathon Overview</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Hackathon Name
          </label>
          <input
            type="text"
            value={hackathonData.name || ''}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter hackathon name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Short Description
          </label>
          <input
            type="text"
            value={hackathonData.shortDescription || ''}
            onChange={(e) => handleInputChange('shortDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Brief description (max 100 chars)"
            maxLength={100}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Full Description
          </label>
          <textarea
            value={hackathonData.fullDescription || ''}
            onChange={(e) => handleInputChange('fullDescription', e.target.value)}
            rows={6}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Detailed description of the hackathon"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Tech Stack
          </label>
          <input
            type="text"
            value={hackathonData.techStack || ''}
            onChange={(e) => handleInputChange('techStack', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g., React, Node.js, Web3"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Experience Level
          </label>
          <select
            value={hackathonData.experienceLevel || ''}
            onChange={(e) => handleInputChange('experienceLevel', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Select level</option>
            <option value="Beginner">Beginner</option>
            <option value="Intermediate">Intermediate</option>
            <option value="Advanced">Advanced</option>
            <option value="All Levels">All Levels</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Location
          </label>
          <input
            type="text"
            value={hackathonData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Virtual, In-person, or Hybrid"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration Start
            </label>
            <input
              type="datetime-local"
              value={hackathonData.registrationDuration?.start || ''}
              onChange={(e) => handleInputChange('registrationDuration', {
                ...hackathonData.registrationDuration,
                start: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Registration End
            </label>
            <input
              type="datetime-local"
              value={hackathonData.registrationDuration?.end || ''}
              onChange={(e) => handleInputChange('registrationDuration', {
                ...hackathonData.registrationDuration,
                end: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hackathon Start
            </label>
            <input
              type="datetime-local"
              value={hackathonData.hackathonDuration?.start || ''}
              onChange={(e) => handleInputChange('hackathonDuration', {
                ...hackathonData.hackathonDuration,
                start: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Hackathon End
            </label>
            <input
              type="datetime-local"
              value={hackathonData.hackathonDuration?.end || ''}
              onChange={(e) => handleInputChange('hackathonDuration', {
                ...hackathonData.hackathonDuration,
                end: e.target.value
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Tips for a great overview:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Use a catchy, descriptive name</li>
            <li>• Clearly explain the challenge and goals</li>
            <li>• Specify required technologies or skills</li>
            <li>• Set realistic dates and deadlines</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateHackathonOverview;