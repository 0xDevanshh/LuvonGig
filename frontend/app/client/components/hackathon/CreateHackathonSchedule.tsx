import React from 'react';

interface CreateHackathonScheduleProps {
  hackathonData: any;
  updateHackathonData: (data: any) => void;
}

const CreateHackathonSchedule: React.FC<CreateHackathonScheduleProps> = ({ hackathonData, updateHackathonData }) => {
  const schedule = hackathonData.schedule || [];

  const addEvent = () => {
    const newEvent = {
      id: `event-${Date.now()}`,
      dateRange: '',
      name: '',
      description: '',
      expanded: false,
      includesSpeaker: false,
      speaker: {
        picture: null,
        username: '',
        profileUrl: '',
        realName: '',
        position: ''
      }
    };
    updateHackathonData({ schedule: [...schedule, newEvent] });
  };

  const removeEvent = (index: number) => {
    const updatedSchedule = schedule.filter((_: any, i: number) => i !== index);
    updateHackathonData({ schedule: updatedSchedule });
  };

  const updateEvent = (index: number, field: string, value: any) => {
    const updatedSchedule = [...schedule];
    updatedSchedule[index] = { ...updatedSchedule[index], [field]: value };
    updateHackathonData({ schedule: updatedSchedule });
  };

  const updateSpeaker = (eventIndex: number, field: string, value: any) => {
    const updatedSchedule = [...schedule];
    const event = updatedSchedule[eventIndex];
    updatedSchedule[eventIndex] = {
      ...event,
      speaker: { ...event.speaker, [field]: value }
    };
    updateHackathonData({ schedule: updatedSchedule });
  };

  const toggleSpeaker = (index: number) => {
    const updatedSchedule = [...schedule];
    const event = updatedSchedule[index];
    updatedSchedule[index] = {
      ...event,
      includesSpeaker: !event.includesSpeaker
    };
    updateHackathonData({ schedule: updatedSchedule });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Set Schedule</h2>

      <div className="space-y-6">
        {schedule.map((event: any, index: number) => (
          <div key={event.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Event {index + 1}</h3>
              <button
                onClick={() => removeEvent(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove Event
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Name
                </label>
                <input
                  type="text"
                  value={event.name}
                  onChange={(e) => updateEvent(index, 'name', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Opening Ceremony, Hacking Begins, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Date & Time Range
                </label>
                <input
                  type="text"
                  value={event.dateRange}
                  onChange={(e) => updateEvent(index, 'dateRange', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Jun 17, 2025 19:00 - Jul 19, 2025 19:00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={event.description}
                  onChange={(e) => updateEvent(index, 'description', e.target.value)}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What will happen during this event?"
                />
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id={`speaker-${index}`}
                  checked={event.includesSpeaker}
                  onChange={() => toggleSpeaker(index)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor={`speaker-${index}`} className="text-sm font-medium text-gray-700">
                  Include guest speaker
                </label>
              </div>

              {event.includesSpeaker && (
                <div className="border border-gray-100 rounded-lg p-4 bg-white space-y-4">
                  <h4 className="text-sm font-medium text-gray-900">Speaker Information</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Real Name
                      </label>
                      <input
                        type="text"
                        value={event.speaker.realName}
                        onChange={(e) => updateSpeaker(index, 'realName', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Speaker's full name"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        value={event.speaker.position}
                        onChange={(e) => updateSpeaker(index, 'position', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="CEO, CTO, Lead Engineer, etc."
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Username
                      </label>
                      <input
                        type="text"
                        value={event.speaker.username}
                        onChange={(e) => updateSpeaker(index, 'username', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="@username"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Profile URL
                      </label>
                      <input
                        type="url"
                        value={event.speaker.profileUrl}
                        onChange={(e) => updateSpeaker(index, 'profileUrl', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://linkedin.com/in/username"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Profile Picture
                    </label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updateSpeaker(index, 'picture', e.target.files?.[0] || null)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        <button
          onClick={addEvent}
          className="w-full py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          + Add Another Event
        </button>

        <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
          <h4 className="font-medium text-purple-900 mb-2">Schedule Guidelines:</h4>
          <ul className="text-sm text-purple-800 space-y-1">
            <li>• Create a clear timeline from registration to winners announcement</li>
            <li>• Include key milestones like registration deadlines, hacking periods, and judging</li>
            <li>• Add buffer time between events for smooth transitions</li>
            <li>• Consider time zones if this is a virtual hackathon</li>
            <li>• Guest speakers can boost engagement and provide valuable insights</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateHackathonSchedule;