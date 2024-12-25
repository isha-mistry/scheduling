"use client";

import React, { useState } from "react";
import { Calendar as CalendarIcon, Clock, Plus, Trash2 } from "lucide-react";
import { format } from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
  id: string;
}

interface DateSchedule {
  date: Date;
  timeSlots: TimeSlot[];
}

const DateSpecificScheduler = () => {
  const [selectedDates, setSelectedDates] = useState<DateSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
    // Add actual days
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }
    return days;
  };

  const isDateSelected = (date: Date) => {
    return selectedDates.some(
      (schedule) => schedule.date.toDateString() === date.toDateString()
    );
  };

  const toggleDateSelection = (date: Date) => {
    if (isDateSelected(date)) {
      setSelectedDates(
        selectedDates.filter(
          (schedule) => schedule.date.toDateString() !== date.toDateString()
        )
      );
    } else {
      setSelectedDates([
        ...selectedDates,
        {
          date,
          timeSlots: [
            {
              startTime: "09:00",
              endTime: "10:00",
              id: Math.random().toString(36).substr(2, 9),
            },
          ],
        },
      ]);
    }
  };

  const addTimeSlot = (dateIndex: number) => {
    const schedule = selectedDates[dateIndex];
    const lastSlot = schedule.timeSlots[schedule.timeSlots.length - 1];
    const [hours] = lastSlot.endTime.split(":");
    const nextStartTime = lastSlot.endTime;
    const nextEndHour = (parseInt(hours) + 1) % 24;
    const nextEndTime = `${nextEndHour.toString().padStart(2, "0")}:00`;

    const newSchedules = [...selectedDates];
    newSchedules[dateIndex].timeSlots.push({
      startTime: nextStartTime,
      endTime: nextEndTime,
      id: Math.random().toString(36).substr(2, 9),
    });
    setSelectedDates(newSchedules);
  };

  const removeTimeSlot = (dateIndex: number, slotIndex: number) => {
    const newSchedules = [...selectedDates];
    newSchedules[dateIndex].timeSlots.splice(slotIndex, 1);
    if (newSchedules[dateIndex].timeSlots.length === 0) {
      newSchedules.splice(dateIndex, 1);
    }
    setSelectedDates(newSchedules);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <h1 className="text-2xl font-bold mb-6">Set Date Specific Hours</h1>

      {/* Calendar Section */}
      <div className="border rounded-lg p-4 bg-white shadow-sm">
        <div className="mb-4 flex justify-between items-center">
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() - 1))
              )
            }
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Previous
          </button>
          <h2 className="text-lg font-medium">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <button
            onClick={() =>
              setCurrentDate(
                new Date(currentDate.setMonth(currentDate.getMonth() + 1))
              )
            }
            className="px-3 py-1 border rounded hover:bg-gray-50"
          >
            Next
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div key={day} className="text-center font-medium p-2">
              {day}
            </div>
          ))}
          {generateCalendarDays().map((date, index) => (
            <div key={index} className="aspect-square">
              {date && (
                <button
                  onClick={() => toggleDateSelection(date)}
                  className={`w-full h-full flex items-center justify-center rounded
                    ${
                      isDateSelected(date)
                        ? "bg-blue-600 text-white"
                        : "hover:bg-gray-100"
                    }`}
                >
                  {date.getDate()}
                </button>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Selected Dates Section */}
      <div className="space-y-4">
        {selectedDates
          .sort((a, b) => a.date.getTime() - b.date.getTime())
          .map((schedule, dateIndex) => (
            <div
              key={schedule.date.toISOString()}
              className="border rounded-lg p-4 bg-white shadow-sm"
            >
              <div className="flex items-center mb-4">
                <CalendarIcon className="mr-2 text-gray-400" size={20} />
                <span className="font-medium">
                  {format(schedule.date, "MMMM d, yyyy")}
                </span>
              </div>

              <div className="space-y-3 ml-7">
                {schedule.timeSlots.map((slot, slotIndex) => (
                  <div key={slot.id} className="flex items-center space-x-4">
                    <Clock className="text-gray-400" size={20} />
                    <div className="text-gray-600">
                      {slot.startTime} - {slot.endTime}
                    </div>
                    <button
                      onClick={() => removeTimeSlot(dateIndex, slotIndex)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 size={20} />
                    </button>
                  </div>
                ))}

                <button
                  onClick={() => addTimeSlot(dateIndex)}
                  className="flex items-center space-x-2 text-blue-600 hover:text-blue-700"
                >
                  <Plus size={20} />
                  <span>Add time slot</span>
                </button>
              </div>
            </div>
          ))}
      </div>

      <button
        onClick={() => console.log({ selectedDates })}
        className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
      >
        Save Schedule
      </button>
    </div>
  );
};

export default DateSpecificScheduler;
