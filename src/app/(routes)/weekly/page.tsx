"use client";

import React, { useState } from "react";
import { Clock, Plus, Trash2, ChevronDown } from "lucide-react";

interface TimeSlot {
  startTime: string; // Local time for UI
  endTime: string; // Local time for UI
  startTimeUTC: string; // UTC time for storage
  endTimeUTC: string; // UTC time for storage
  id: string;
  isEditing: boolean;
}

interface DaySchedule {
  day: string;
  date: string;
  dateUTC: string;
  isEnabled: boolean;
  timeSlots: TimeSlot[];
}

// Generate time options in local time (24-hour format)
const timeOptions = Array.from({ length: 24 }, (_, i) => {
  const hour = i.toString().padStart(2, "0");
  return `${hour}:00`;
});

// Helper function to convert local time to UTC
const localToUTC = (date: string, time: string): string => {
  const [hours] = time.split(":");
  const localDateTime = new Date(`${date}T${hours}:00:00`);
  return localDateTime.toISOString();
};

// Helper function to get next 7 days starting from today
const getNext7Days = (): { date: string; dateUTC: string }[] => {
  const dates = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);

    // Format date as YYYY-MM-DD for local display
    const formattedDate = date.toISOString().split("T")[0];
    // Store full UTC date
    const utcDate = date.toISOString();

    dates.push({
      date: formattedDate,
      dateUTC: utcDate,
    });
  }

  return dates;
};

const AvailabilityScheduler = () => {
  // Initialize schedule with dates
  const initialSchedule = (): DaySchedule[] => {
    const days = [
      "Sunday",
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
    ];
    const next7Days = getNext7Days();
    const today = new Date();
    const startDayIndex = today.getDay(); // Get current day index (0-6)

    // Reorder days array to start from current day
    const reorderedDays = [
      ...days.slice(startDayIndex),
      ...days.slice(0, startDayIndex),
    ];

    return reorderedDays.map((day, index) => ({
      day,
      date: next7Days[index].date,
      dateUTC: next7Days[index].dateUTC,
      isEnabled: false,
      timeSlots: [],
    }));
  };

  const [schedule, setSchedule] = useState<DaySchedule[]>(initialSchedule());
  const [recurrenceType, setRecurrenceType] = useState<
    "week" | "month" | "twoMonths"
  >("week");

  const timeToNumber = (time: string): number => {
    const [hours] = time.split(":").map(Number);
    return hours;
  };

  const getNextTimeSlot = (daySchedule: DaySchedule, timeSlots: TimeSlot[]) => {
    if (timeSlots.length === 0) {
      const startTime = "09:00";
      const endTime = "10:00";
      return {
        startTime,
        endTime,
        startTimeUTC: localToUTC(daySchedule.date, startTime),
        endTimeUTC: localToUTC(daySchedule.date, endTime),
        id: Math.random().toString(36).substr(2, 9),
        isEditing: false,
      };
    }

    const lastSlot = timeSlots[timeSlots.length - 1];
    const [hours] = lastSlot.endTime.split(":");
    const nextStartTime = lastSlot.endTime;
    const nextEndHour = (parseInt(hours) + 1) % 24;
    const nextEndTime = `${nextEndHour.toString().padStart(2, "0")}:00`;

    return {
      startTime: nextStartTime,
      endTime: nextEndTime,
      startTimeUTC: localToUTC(daySchedule.date, nextStartTime),
      endTimeUTC: localToUTC(daySchedule.date, nextEndTime),
      id: Math.random().toString(36).substr(2, 9),
      isEditing: false,
    };
  };

  const addTimeSlot = (dayIndex: number) => {
    const newSchedule = [...schedule];
    const nextSlot = getNextTimeSlot(
      newSchedule[dayIndex],
      newSchedule[dayIndex].timeSlots
    );
    newSchedule[dayIndex].timeSlots.push(nextSlot);
    setSchedule(newSchedule);
  };

  const removeTimeSlot = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots.splice(slotIndex, 1);
    setSchedule(newSchedule);
  };

  const toggleDay = (dayIndex: number) => {
    const newSchedule = [...schedule];
    if (newSchedule[dayIndex].isEnabled) {
      newSchedule[dayIndex].timeSlots = [];
    } else if (newSchedule[dayIndex].timeSlots.length === 0) {
      addTimeSlot(dayIndex);
    }
    newSchedule[dayIndex].isEnabled = !newSchedule[dayIndex].isEnabled;
    setSchedule(newSchedule);
  };

  const toggleEdit = (dayIndex: number, slotIndex: number) => {
    const newSchedule = [...schedule];
    newSchedule[dayIndex].timeSlots[slotIndex].isEditing =
      !newSchedule[dayIndex].timeSlots[slotIndex].isEditing;
    setSchedule(newSchedule);
  };

  const updateTime = (
    dayIndex: number,
    slotIndex: number,
    field: "startTime" | "endTime",
    value: string
  ) => {
    const newSchedule = [...schedule];
    const currentSlot = newSchedule[dayIndex].timeSlots[slotIndex];
    const currentDay = newSchedule[dayIndex];

    if (field === "startTime") {
      currentSlot.startTime = value;
      currentSlot.startTimeUTC = localToUTC(currentDay.date, value);

      const startHour = timeToNumber(value);
      const endHour = timeToNumber(currentSlot.endTime);

      if (endHour <= startHour) {
        const newEndHour = (startHour + 1) % 24;
        const newEndTime = `${newEndHour.toString().padStart(2, "0")}:00`;
        currentSlot.endTime = newEndTime;
        currentSlot.endTimeUTC = localToUTC(currentDay.date, newEndTime);
      }
    } else {
      const startHour = timeToNumber(currentSlot.startTime);
      const newEndHour = timeToNumber(value);

      if (newEndHour > startHour) {
        currentSlot.endTime = value;
        currentSlot.endTimeUTC = localToUTC(currentDay.date, value);
      }
    }

    setSchedule(newSchedule);
  };

  const getAvailableEndTimes = (startTime: string) => {
    const startHour = timeToNumber(startTime);
    return timeOptions.filter((time) => timeToNumber(time) > startHour);
  };

  // Function to get data for backend storage
  const getScheduleData = () => {
    const enabledSchedule = schedule
      .filter((day) => day.isEnabled)
      .map((day) => ({
        day: day.day,
        date: day.dateUTC, // Only send UTC date
        timeSlots: day.timeSlots.map(({ startTimeUTC, endTimeUTC }) => ({
          startTime: startTimeUTC, // Only send UTC times
          endTime: endTimeUTC,
        })),
      }));

    return {
      schedule: enabledSchedule,
      recurrenceType,
    };
  };

  // Format the date for display
  const formatDisplayDate = (date: string) => {
    return new Date(date).toLocaleDateString();
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Set Your Availability</h1>

      <div className="space-y-4 text-black">
        {schedule.map((day, dayIndex) => (
          <div
            key={day.day}
            className="border rounded-lg p-4 bg-white shadow-sm"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  checked={day.isEnabled}
                  onChange={() => toggleDay(dayIndex)}
                  className="w-4 h-4 rounded"
                />
                <span className="font-medium">
                  {day.day} - {formatDisplayDate(day.date)}
                </span>
              </div>
            </div>

            {day.isEnabled && (
              <div className="space-y-3">
                {day.timeSlots.map((slot, slotIndex) => (
                  <div key={slot.id} className="flex items-center space-x-4">
                    <Clock className="text-gray-400" size={20} />
                    <div className="flex items-center space-x-2 flex-grow">
                      {slot.isEditing ? (
                        <>
                          <div className="relative">
                            <select
                              value={slot.startTime}
                              onChange={(e) =>
                                updateTime(
                                  dayIndex,
                                  slotIndex,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              className="border rounded px-3 py-2 pr-8 appearance-none bg-white"
                            >
                              {timeOptions.map((time) => (
                                <option key={time} value={time}>
                                  {time}
                                </option>
                              ))}
                            </select>
                            <ChevronDown className="absolute right-2 top-3 w-4 h-4 pointer-events-none text-gray-500" />
                          </div>
                          <span>-</span>
                          <div className="relative">
                            <select
                              value={slot.endTime}
                              onChange={(e) =>
                                updateTime(
                                  dayIndex,
                                  slotIndex,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              className="border rounded px-3 py-2 pr-8 appearance-none bg-white"
                            >
                              {getAvailableEndTimes(slot.startTime).map(
                                (time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                )
                              )}
                            </select>
                            <ChevronDown className="absolute right-2 top-3 w-4 h-4 pointer-events-none text-gray-500" />
                          </div>
                        </>
                      ) : (
                        <div
                          className="text-gray-600"
                          onClick={() => toggleEdit(dayIndex, slotIndex)}
                        >
                          {slot.startTime} - {slot.endTime}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => toggleEdit(dayIndex, slotIndex)}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      {slot.isEditing ? "Save" : "Edit"}
                    </button>
                    <button
                      onClick={() => removeTimeSlot(dayIndex, slotIndex)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addTimeSlot(dayIndex)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Plus size={20} />
                  <span>Add time slot</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="mt-6 border-t pt-6">
        <h2 className="text-lg font-medium mb-3">Recurrence</h2>
        <select
          value={recurrenceType}
          onChange={(e) =>
            setRecurrenceType(e.target.value as "week" | "month" | "twoMonths")
          }
          className="border rounded px-3 py-2 text-black"
        >
          <option value="week">Weekly</option>
          <option value="month">Monthly</option>
          <option value="twoMonths">Two Months</option>
        </select>
      </div>

      <button
        onClick={() => console.log(getScheduleData())}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Save Availability
      </button>
    </div>
  );
};

export default AvailabilityScheduler;
