'use client'
import React, { useState } from 'react';
import {
  Plus,
  Trash2,
  Clock,
  Calendar,
  MapPin,
  Users,
  Mic,
  Trophy,
  Coffee,
  BookOpen,
  Presentation,
  Award,
  X,
  DoorOpen,
  ChevronUp,
  ChevronDown,
  GripVertical,
  Star,
  Target,
  Lightbulb
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useHackathonForm } from '@/context/HackathonFormContext';
import { ScheduleItem } from '@/context/HackathonFormContext';

interface CreateHackathonScheduleProps {
  className?: string;
}

export default function CreateHackathonSchedule({ className }: CreateHackathonScheduleProps) {
  const { formData, updateFormData, setSaved } = useHackathonForm();

  const eventTypes = [
    { value: 'opening', label: 'Opening Ceremony', icon: DoorOpen, color: 'blue' },
    { value: 'workshop', label: 'Workshop', icon: BookOpen, color: 'green' },
    { value: 'presentation', label: 'Presentation', icon: Presentation, color: 'purple' },
    { value: 'judging', label: 'Judging', icon: Trophy, color: 'yellow' },
    { value: 'awards', label: 'Awards Ceremony', icon: Award, color: 'pink' },
    { value: 'break', label: 'Break', icon: Coffee, color: 'gray' },
    { value: 'closing', label: 'Closing Ceremony', icon: Star, color: 'red' },
    { value: 'other', label: 'Other', icon: Target, color: 'orange' }
  ];

  const scheduleTemplates = [
    {
      name: 'Classic 24-Hour Hackathon',
      items: [
        { type: 'opening', title: 'Opening Ceremony & Welcome', duration: 60 },
        { type: 'workshop', title: 'Ideation & Team Formation', duration: 90 },
        { type: 'break', title: 'Lunch Break', duration: 60 },
        { type: 'workshop', title: 'Technical Workshop', duration: 120 },
        { type: 'break', title: 'Dinner Break', duration: 60 },
        { type: 'presentation', title: 'Project Presentations', duration: 180 },
        { type: 'judging', title: 'Judging & Deliberation', duration: 60 },
        { type: 'awards', title: 'Awards Ceremony', duration: 60 },
        { type: 'closing', title: 'Closing Remarks', duration: 30 }
      ]
    },
    {
      name: 'Weekend Hackathon',
      items: [
        { type: 'opening', title: 'Opening Ceremony', duration: 90 },
        { type: 'workshop', title: 'Team Formation', duration: 60 },
        { type: 'break', title: 'Lunch', duration: 60 },
        { type: 'workshop', title: 'Development Session 1', duration: 240 },
        { type: 'break', title: 'Dinner', duration: 60 },
        { type: 'workshop', title: 'Development Session 2', duration: 180 },
        { type: 'break', title: 'Overnight Break', duration: 480 },
        { type: 'presentation', title: 'Final Presentations', duration: 180 },
        { type: 'judging', title: 'Judging', duration: 120 },
        { type: 'awards', title: 'Awards Ceremony', duration: 90 }
      ]
    }
  ];

  const addScheduleItem = (template?: any) => {
    const newItem: ScheduleItem = {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      title: template?.title || '',
      description: '',
      startTime: '',
      endTime: '',
      date: formData.startDate || '',
      location: '',
      type: template?.type || 'other',
      speakers: [],
      isRequired: template?.isRequired || true
    };
    updateFormData({ schedule: [...formData.schedule, newItem] });
    setSaved('schedule', true);
  };

  const updateScheduleItem = (id: string, field: keyof ScheduleItem, value: any) => {
    const updatedSchedule = formData.schedule.map(item =>
      item.id === id ? { ...item, [field]: value } : item
    );
    updateFormData({ schedule: updatedSchedule });
    setSaved('schedule', true);
  };

  const removeScheduleItem = (id: string) => {
    updateFormData({ schedule: formData.schedule.filter(item => item.id !== id) });
    setSaved('schedule', true);
  };

  const moveScheduleItem = (index: number, direction: 'up' | 'down') => {
    const newSchedule = [...formData.schedule];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;

    if (targetIndex >= 0 && targetIndex < newSchedule.length) {
      [newSchedule[index], newSchedule[targetIndex]] = [newSchedule[targetIndex], newSchedule[index]];
      updateFormData({ schedule: newSchedule });
      setSaved('schedule', true);
    }
  };

  const addSpeaker = (itemId: string, speaker: string) => {
    if (!speaker.trim()) return;

    const item = formData.schedule.find(i => i.id === itemId);
    if (item && !item.speakers?.includes(speaker.trim())) {
      updateScheduleItem(itemId, 'speakers', [...(item.speakers || []), speaker.trim()]);
    }
  };

  const removeSpeaker = (itemId: string, speakerToRemove: string) => {
    const item = formData.schedule.find(i => i.id === itemId);
    if (item && item.speakers) {
      updateScheduleItem(itemId, 'speakers', item.speakers.filter(s => s !== speakerToRemove));
    }
  };

  const loadTemplate = (template: any) => {
    const newItems = template.items.map((item: any, index: number) => ({
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9) + index,
      title: item.title,
      description: '',
      startTime: '',
      endTime: '',
      date: formData.startDate || '',
      location: '',
      type: item.type,
      speakers: [],
      isRequired: item.type !== 'break'
    }));
    updateFormData({ schedule: newItems });
    setSaved('schedule', true);
  };

  const getEventIcon = (type: string) => {
    const eventType = eventTypes.find(t => t.value === type);
    const Icon = eventType?.icon || Target;
    const colorClass = `text-${eventType?.color || 'gray'}-600`;
    return <Icon className={`w-5 h-5 ${colorClass}`} />;
  };

  const getScheduleStats = () => {
    const totalItems = formData.schedule.length;
    const requiredItems = formData.schedule.filter(item => item.isRequired).length;
    const estimatedHours = formData.schedule.reduce((total, item) => {
      if (item.startTime && item.endTime) {
        const start = new Date(`2000-01-01T${item.startTime}`);
        const end = new Date(`2000-01-01T${item.endTime}`);
        return total + (end.getTime() - start.getTime()) / (1000 * 60 * 60);
      }
      return total;
    }, 0);

    return { totalItems, requiredItems, estimatedHours };
  };

  const stats = getScheduleStats();

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">Schedule & Timeline</h3>
        <p className="text-gray-600">Create a detailed timeline for your hackathon events.</p>
      </div>

      {/* Schedule Stats */}
      {formData.schedule.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-blue-600" />
              <span className="font-semibold text-gray-900">Total Events</span>
            </div>
            <div className="text-2xl font-bold text-blue-600">{stats.totalItems}</div>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Users className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-gray-900">Required</span>
            </div>
            <div className="text-2xl font-bold text-green-600">{stats.requiredItems}</div>
          </div>
          <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <Clock className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-gray-900">Duration</span>
            </div>
            <div className="text-2xl font-bold text-purple-600">{stats.estimatedHours.toFixed(1)}h</div>
          </div>
        </div>
      )}

      {/* Quick Templates */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Quick Schedule Templates</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {scheduleTemplates.map((template, index) => (
            <div
              key={index}
              className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
              onClick={() => loadTemplate(template)}
            >
              <h5 className="font-semibold text-gray-900 mb-2">{template.name}</h5>
              <div className="text-sm text-gray-600">
                {template.items.length} events • {Math.round(template.items.reduce((sum: number, item: any) => sum + item.duration, 0) / 60)} hours
              </div>
              <div className="flex flex-wrap gap-1 mt-2">
                {template.items.slice(0, 3).map((item: any, idx: number) => (
                  <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    {item.title}
                  </span>
                ))}
                {template.items.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded">
                    +{template.items.length - 3} more
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Quick Add Common Events */}
      <div>
        <h4 className="font-semibold text-gray-900 mb-3">Quick Add Common Events</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {eventTypes.map((type) => (
            <button
              key={type.value}
              onClick={() => addScheduleItem({ type: type.value, title: type.label, isRequired: true })}
              className="flex items-center space-x-2 px-3 py-2 border border-gray-300 rounded-md hover:border-blue-500 hover:bg-blue-50 transition-colors"
            >
              <type.icon className="w-4 h-4" />
              <span className="text-sm">{type.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Schedule Timeline */}
      <div className="space-y-4">
        {formData.schedule.map((item, index) => (
          <div
            key={item.id}
            className="border border-gray-200 rounded-lg p-4 bg-white hover:shadow-md transition-shadow"
          >
            {/* Item Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-1">
                  <GripVertical className="w-4 h-4 text-gray-400" />
                  {index > 0 && (
                    <button
                      onClick={() => moveScheduleItem(index, 'up')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronUp size={16} />
                    </button>
                  )}
                  {index < formData.schedule.length - 1 && (
                    <button
                      onClick={() => moveScheduleItem(index, 'down')}
                      className="p-1 text-gray-400 hover:text-gray-600"
                    >
                      <ChevronDown size={16} />
                    </button>
                  )}
                </div>
                <div className="flex items-center space-x-2">
                  {getEventIcon(item.type)}
                  <span className="font-semibold text-gray-900">
                    {item.title || 'New Event'}
                  </span>
                  {item.isRequired && (
                    <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Required</span>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeScheduleItem(item.id)}
                className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Event Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Type
                </label>
                <select
                  value={item.type}
                  onChange={(e) => updateScheduleItem(item.id, 'type', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {eventTypes.map(type => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Event Title *
                </label>
                <input
                  type="text"
                  value={item.title}
                  onChange={(e) => updateScheduleItem(item.id, 'title', e.target.value)}
                  placeholder="Event title"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Date */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Date *
                </label>
                <input
                  type="date"
                  value={item.date}
                  onChange={(e) => updateScheduleItem(item.id, 'date', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Time Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  Start Time *
                </label>
                <input
                  type="time"
                  value={item.startTime}
                  onChange={(e) => updateScheduleItem(item.id, 'startTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Clock className="w-4 h-4 inline mr-1" />
                  End Time *
                </label>
                <input
                  type="time"
                  value={item.endTime}
                  onChange={(e) => updateScheduleItem(item.id, 'endTime', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Location */}
              <div className="lg:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <MapPin className="w-4 h-4 inline mr-1" />
                  Location
                </label>
                <input
                  type="text"
                  value={item.location}
                  onChange={(e) => updateScheduleItem(item.id, 'location', e.target.value)}
                  placeholder="e.g., Main Hall, Virtual Room A, etc."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Description */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  value={item.description}
                  onChange={(e) => updateScheduleItem(item.id, 'description', e.target.value)}
                  placeholder="Describe what will happen during this event..."
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Speakers */}
              <div className="lg:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  <Mic className="w-4 h-4 inline mr-1" />
                  Speakers
                </label>
                <div className="space-y-2">
                  <div className="flex flex-wrap gap-2 mb-2">
                    {item.speakers?.map((speaker, speakerIndex) => (
                      <span
                        key={speakerIndex}
                        className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full flex items-center space-x-1"
                      >
                        <span>{speaker}</span>
                        <button
                          onClick={() => removeSpeaker(item.id, speaker)}
                          className="text-blue-600 hover:text-blue-800 ml-1"
                        >
                          <X size={12} />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Add speaker name..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addSpeaker(item.id, e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button
                      onClick={(e) => {
                        const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                        addSpeaker(item.id, input.value);
                        input.value = '';
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </div>

              {/* Required Checkbox */}
              <div className="lg:col-span-3">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={item.isRequired}
                    onChange={(e) => updateScheduleItem(item.id, 'isRequired', e.target.checked)}
                    className="rounded border-gray-300"
                  />
                  <span className="text-sm font-medium text-gray-700">
                    This event is required for all participants
                  </span>
                </label>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Custom Event Button */}
      <div className="flex justify-center">
        <button
          onClick={() => addScheduleItem()}
          className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus size={20} />
          <span>Add Custom Event</span>
        </button>
      </div>

      {/* Empty State */}
      {formData.schedule.length === 0 && (
        <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
          <Calendar className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Schedule Created Yet</h3>
          <p className="text-gray-500 mb-4">Create a timeline to help participants plan their hackathon experience.</p>
          <button
            onClick={() => loadTemplate(scheduleTemplates[0])}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Load Template Schedule
          </button>
        </div>
      )}
    </div>
  );
}