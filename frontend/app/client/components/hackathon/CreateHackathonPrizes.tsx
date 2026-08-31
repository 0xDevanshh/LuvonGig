import React from 'react';

interface CreateHackathonPrizesProps {
  hackathonData: any;
  updateHackathonData: (data: any) => void;
}

const CreateHackathonPrizes: React.FC<CreateHackathonPrizesProps> = ({ hackathonData, updateHackathonData }) => {
  const prizes = hackathonData.prizes || [];

  const addPrize = () => {
    const newPrize = {
      id: `prize-${prizes.length + 1}`,
      name: '',
      description: '',
      winners: 1,
      amount: '',
      expanded: false,
      criteria: [{
        id: `criteria-${prizes.length + 1}-1`,
        name: '',
        description: '',
        points: 0
      }]
    };
    updateHackathonData({ prizes: [...prizes, newPrize] });
  };

  const removePrize = (index: number) => {
    const updatedPrizes = prizes.filter((_: any, i: number) => i !== index);
    updateHackathonData({ prizes: updatedPrizes });
  };

  const updatePrize = (index: number, field: string, value: any) => {
    const updatedPrizes = [...prizes];
    updatedPrizes[index] = { ...updatedPrizes[index], [field]: value };
    updateHackathonData({ prizes: updatedPrizes });
  };

  const addCriteria = (prizeIndex: number) => {
    const prize = prizes[prizeIndex];
    const newCriteria = {
      id: `criteria-${prizeIndex}-${prize.criteria.length + 1}`,
      name: '',
      description: '',
      points: 0
    };
    const updatedPrizes = [...prizes];
    updatedPrizes[prizeIndex] = {
      ...prize,
      criteria: [...prize.criteria, newCriteria]
    };
    updateHackathonData({ prizes: updatedPrizes });
  };

  const updateCriteria = (prizeIndex: number, criteriaIndex: number, field: string, value: any) => {
    const updatedPrizes = [...prizes];
    const prize = updatedPrizes[prizeIndex];
    const updatedCriteria = [...prize.criteria];
    updatedCriteria[criteriaIndex] = { ...updatedCriteria[criteriaIndex], [field]: value };
    updatedPrizes[prizeIndex] = { ...prize, criteria: updatedCriteria };
    updateHackathonData({ prizes: updatedPrizes });
  };

  const removeCriteria = (prizeIndex: number, criteriaIndex: number) => {
    const updatedPrizes = [...prizes];
    const prize = updatedPrizes[prizeIndex];
    updatedPrizes[prizeIndex] = {
      ...prize,
      criteria: prize.criteria.filter((_: any, i: number) => i !== criteriaIndex)
    };
    updateHackathonData({ prizes: updatedPrizes });
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Set Up Prizes</h2>

      <div className="space-y-6">
        {prizes.map((prize: any, index: number) => (
          <div key={prize.id} className="border border-gray-200 rounded-lg p-6 bg-gray-50">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-medium">Prize {index + 1}</h3>
              <button
                onClick={() => removePrize(index)}
                className="text-red-600 hover:text-red-700 text-sm"
              >
                Remove Prize
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prize Name
                  </label>
                  <input
                    type="text"
                    value={prize.name}
                    onChange={(e) => updatePrize(index, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g., First Place, Innovation Award"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Prize Amount
                  </label>
                  <input
                    type="text"
                    value={prize.amount}
                    onChange={(e) => updatePrize(index, 'amount', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="$1000, 5 ICP, etc."
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={prize.description}
                  onChange={(e) => updatePrize(index, 'description', e.target.value)}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="What does this prize include?"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Winners
                </label>
                <input
                  type="number"
                  value={prize.winners}
                  onChange={(e) => updatePrize(index, 'winners', parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium text-gray-700">Judging Criteria</h4>
                  <button
                    onClick={() => addCriteria(index)}
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    + Add Criteria
                  </button>
                </div>

                <div className="space-y-2">
                  {prize.criteria.map((criteria: any, criteriaIndex: number) => (
                    <div key={criteria.id} className="border border-gray-100 rounded p-3 bg-white">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm text-gray-600">Criteria {criteriaIndex + 1}</span>
                        {prize.criteria.length > 1 && (
                          <button
                            onClick={() => removeCriteria(index, criteriaIndex)}
                            className="text-red-600 hover:text-red-700 text-xs"
                          >
                            Remove
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input
                          type="text"
                          value={criteria.name}
                          onChange={(e) => updateCriteria(index, criteriaIndex, 'name', e.target.value)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Criteria name"
                        />
                        <input
                          type="number"
                          value={criteria.points}
                          onChange={(e) => updateCriteria(index, criteriaIndex, 'points', parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Points"
                          min="0"
                        />
                      </div>

                      <textarea
                        value={criteria.description}
                        onChange={(e) => updateCriteria(index, criteriaIndex, 'description', e.target.value)}
                        rows={2}
                        className="w-full px-2 py-1 text-sm border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                        placeholder="Description of this criteria"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}

        <button
          onClick={addPrize}
          className="w-full py-3 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          + Add Another Prize
        </button>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h4 className="font-medium text-yellow-900 mb-2">Prize Guidelines:</h4>
          <ul className="text-sm text-yellow-800 space-y-1">
            <li>• Clear prize structure increases participation</li>
            <li>• Specific judging criteria help participants focus</li>
            <li>• Consider both cash and non-cash prizes</li>
            <li>• Points should total 100 for each prize</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CreateHackathonPrizes;