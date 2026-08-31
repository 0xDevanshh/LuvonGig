'use client'
import React from 'react';
interface Criterion {
  name: string;
  description: string;
  score: number;
}
interface JudgingCriteriaProps {
  criteria: Criterion[];
}
export function JudgingCriteria({
  criteria
}: JudgingCriteriaProps) {
  return <div>
      <h2 className="text-xl font-bold mb-6">Evaluation Criteria</h2>
      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="py-3 text-left font-medium text-gray-600">Name</th>
              <th className="py-3 text-left font-medium text-gray-600">
                Description
              </th>
              <th className="py-3 text-right font-medium text-gray-600">
                Max Score
              </th>
            </tr>
          </thead>
          <tbody>
            {criteria.map((criterion, index) => <tr key={index} className="border-b border-gray-200">
                <td className="py-4 pr-4 font-medium">{criterion.name}</td>
                <td className="py-4 pr-4 text-gray-700">
                  {criterion.description}
                </td>
                <td className="py-4 text-right">{criterion.score}</td>
              </tr>)}
          </tbody>
        </table>
      </div>
      <div className="mt-8">
        <h3 className="text-lg font-semibold mb-4">Voting</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <h4 className="font-medium mb-2">Judges</h4>
            <div className="flex -space-x-2">
              <img src="https://via.placeholder.com/40" alt="Judge" className="w-10 h-10 rounded-full border-2 border-white" />
              <img src="https://via.placeholder.com/40" alt="Judge" className="w-10 h-10 rounded-full border-2 border-white" />
              <img src="https://via.placeholder.com/40" alt="Judge" className="w-10 h-10 rounded-full border-2 border-white" />
            </div>
          </div>
          <div>
            <h4 className="font-medium mb-2">Judging Mode</h4>
            <p>Judges Only</p>
          </div>
          <div>
            <h4 className="font-medium mb-2">Max Votes per Judge</h4>
            <p>100</p>
          </div>
        </div>
      </div>
    </div>;
}