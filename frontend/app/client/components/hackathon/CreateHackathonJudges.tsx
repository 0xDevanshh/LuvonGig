import React from 'react';

interface CreateHackathonJudgesProps {
  hackathonData: any;
  updateHackathonData: (data: any) => void;
}

const CreateHackathonJudges: React.FC<CreateHackathonJudgesProps> = ({ hackathonData, updateHackathonData }) => {
  const judges = hackathonData.judges || [];
  const pendingJudges = hackathonData.pendingJudges || [];

  const addJudge = () => {
    const newJudge = {
      id: `judge-${Date.now()}`,
      name: '',
      email: '',
      expertise: [],
    };
    updateHackathonData({ judges: [...judges, newJudge] });
  };

  const addPendingJudge = () => {
    const newPendingJudge = {
      id: `pending-judge-${Date.now()}`,
      name: '',
      email: '',
      expertise: [],
    };
    updateHackathonData({ pendingJudges: [...pendingJudges, newPendingJudge] });
  };

  const removeJudge = (index: number) => {
    const updatedJudges = judges.filter((_: any, i: number) => i !== index);
    updateHackathonData({ judges: updatedJudges });
  };

  const removePendingJudge = (index: number) => {
    const updatedPendingJudges = pendingJudges.filter((_: any, i: number) => i !== index);
    updateHackathonData({ pendingJudges: updatedPendingJudges });
  };

  const updateJudge = (index: number, field: string, value: any) => {
    const updatedJudges = [...judges];
    updatedJudges[index] = { ...updatedJudges[index], [field]: value };
    updateHackathonData({ judges: updatedJudges });
  };

  const updatePendingJudge = (index: number, field: string, value: any) => {
    const updatedPendingJudges = [...pendingJudges];
    updatedPendingJudges[index] = { ...updatedPendingJudges[index], [field]: value };
    updateHackathonData({ pendingJudges: updatedPendingJudges });
  };

  const updateExpertise = (index: number, expertiseString: string, isPending = false) => {
    const expertiseArray = expertiseString.split(',').map(s => s.trim()).filter(s => s);
    if (isPending) {
      updatePendingJudge(index, 'expertise', expertiseArray);
    } else {
      updateJudge(index, 'expertise', expertiseArray);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Add Judges</h2>

      <div className="space-y-8">
        {/* Confirmed Judges */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Confirmed Judges</h3>
            <button
              onClick={addJudge}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              + Add Judge
            </button>
          </div>

          <div className="space-y-4">
            {judges.map((judge: any, index: number) => (
              <div key={judge.id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Judge {index + 1}</h4>
                  <button
                    onClick={() => removeJudge(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={judge.name}
                      onChange={(e) => updateJudge(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Judge name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={judge.email}
                      onChange={(e) => updateJudge(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="judge@example.com"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expertise (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(judge.expertise) ? judge.expertise.join(', ') : judge.expertise}
                    onChange={(e) => updateExpertise(index, e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Web3, AI/ML, Frontend Development"
                  />
                </div>
              </div>
            ))}

            {judges.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                <p className="text-gray-500">No confirmed judges added yet</p>
                <button
                  onClick={addJudge}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Add your first judge
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Pending Judges */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Pending Invitations</h3>
            <button
              onClick={addPendingJudge}
              className="text-blue-600 hover:text-blue-700 text-sm"
            >
              + Send Invitation
            </button>
          </div>

          <div className="space-y-4">
            {pendingJudges.map((judge: any, index: number) => (
              <div key={judge.id} className="border border-gray-200 rounded-lg p-4 bg-blue-50">
                <div className="flex justify-between items-start mb-3">
                  <h4 className="font-medium">Invitation {index + 1}</h4>
                  <button
                    onClick={() => removePendingJudge(index)}
                    className="text-red-600 hover:text-red-700 text-sm"
                  >
                    Remove
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Name
                    </label>
                    <input
                      type="text"
                      value={judge.name}
                      onChange={(e) => updatePendingJudge(index, 'name', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Judge name"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      value={judge.email}
                      onChange={(e) => updatePendingJudge(index, 'email', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="judge@example.com"
                    />
                  </div>
                </div>

                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Expertise (comma-separated)
                  </label>
                  <input
                    type="text"
                    value={Array.isArray(judge.expertise) ? judge.expertise.join(', ') : judge.expertise}
                    onChange={(e) => updateExpertise(index, e.target.value, true)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Web3, AI/ML, Frontend Development"
                  />
                </div>
              </div>
            ))}

            {pendingJudges.length === 0 && (
              <div className="text-center py-8 border-2 border-dashed border-blue-300 rounded-lg">
                <p className="text-blue-500">No pending invitations</p>
                <button
                  onClick={addPendingJudge}
                  className="mt-2 text-blue-600 hover:text-blue-700"
                >
                  Send first invitation
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-900 mb-2">Judge Guidelines:</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Choose judges with relevant experience in your hackathon theme</li>
            <li>• Confirmed judges can immediately start reviewing submissions</li>
            <li>• Pending judges will receive email invitations to join</li>
            <li>• You can add or remove judges anytime from the dashboard</li>
            <li>• Consider diversity in expertise and background for balanced evaluation</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateHackathonJudges;