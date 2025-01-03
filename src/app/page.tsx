"use client";

import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Trash2,
  ChevronDown,
  Repeat,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  format,
  isToday,
  isBefore,
  startOfDay,
  parseISO,
  addDays,
  addWeeks,
  isSameDay,
} from "date-fns";

interface TimeSlot {
  startTime: string;
  endTime: string;
  id: string;
}

interface DateSchedule {
  date: Date;
  timeSlots: TimeSlot[];
  isRecurring?: boolean;
}

const generateTimeOptions = (selectedDate: Date) => {
  const options: string[] = [];
  const now = new Date();
  const isCurrentDate = isToday(selectedDate);

  const startHour = isCurrentDate ? now.getHours() : 0;
  const startMinute = isCurrentDate ? Math.ceil(now.getMinutes() / 15) * 15 : 0;

  for (let hour = startHour; hour < 24; hour++) {
    for (
      let minute = hour === startHour ? startMinute : 0;
      minute < 60;
      minute += 15
    ) {
      if (isCurrentDate) {
        const optionTime = new Date(selectedDate);
        optionTime.setHours(hour, minute, 0, 0);
        if (isBefore(optionTime, now)) continue;
      }

      options.push(
        `${hour.toString().padStart(2, "0")}:${minute
          .toString()
          .padStart(2, "0")}`
      );
    }
  }
  return options;
};

// Function to generate recurring dates for a month
const generateRecurringDates = (baseDate: Date): Date[] => {
  const dates: Date[] = [];
  const dayOfWeek = baseDate.getDay();
  let currentDate = baseDate;

  // Generate 4 more occurrences (total of 5 weeks)
  for (let i = 0; i < 4; i++) {
    currentDate = addWeeks(currentDate, 1);
    dates.push(currentDate);
  }

  return dates;
};

const DateSpecificScheduler = () => {
  const [selectedDates, setSelectedDates] = useState<DateSchedule[]>([]);
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = getDaysInMonth(year, month);
    const firstDay = new Date(year, month, 1).getDay();

    const days = [];
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }
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

  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date())) && !isToday(date);
  };

  const createTimeSlot = (date: Date, startTime: string) => {
    const [hours, minutes] = startTime.split(":");
    const endHours = (parseInt(hours) + 1) % 24;

    if (isToday(date)) {
      const now = new Date();
      const slotTime = new Date(date);
      slotTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      if (isBefore(slotTime, now)) {
        const nextMinute = Math.ceil(now.getMinutes() / 15) * 15;
        const nextHour =
          nextMinute === 60 ? now.getHours() + 1 : now.getHours();
        startTime = `${nextHour.toString().padStart(2, "0")}:${(nextMinute % 60)
          .toString()
          .padStart(2, "0")}`;
      }
    }

    return {
      startTime: startTime,
      endTime: `${endHours.toString().padStart(2, "0")}:${minutes}`,
      id: Math.random().toString(36).substr(2, 9),
    };
  };

  const toggleRecurring = (dateIndex: number) => {
    const newSchedules = [...selectedDates];
    const schedule = newSchedules[dateIndex];

    if (!schedule.isRecurring) {
      // Generate recurring dates
      const recurringDates = generateRecurringDates(schedule.date);

      // Create new schedules for recurring dates
      const newRecurringSchedules = recurringDates.map((date) => ({
        date,
        timeSlots: schedule.timeSlots.map((slot) => ({
          ...slot,
          id: Math.random().toString(36).substr(2, 9),
        })),
        isRecurring: true,
      }));

      // Add recurring flag to original schedule
      schedule.isRecurring = true;

      // Add all new schedules
      setSelectedDates([...newSchedules, ...newRecurringSchedules]);
    } else {
      // Remove all recurring instances
      const dayOfWeek = schedule.date.getDay();
      const filteredSchedules = newSchedules.filter(
        (s) => !(s.isRecurring && s.date.getDay() === dayOfWeek)
      );
      schedule.isRecurring = false;
      setSelectedDates(filteredSchedules);
    }
  };

  const toggleDateSelection = (date: Date) => {
    if (isDateDisabled(date)) return;

    if (isDateSelected(date)) {
      setSelectedDates(
        selectedDates.filter(
          (schedule) => schedule.date.toDateString() !== date.toDateString()
        )
      );
    } else {
      const defaultStartTime = isToday(date)
        ? generateTimeOptions(date)[0]
        : "09:00";

      setSelectedDates([
        ...selectedDates,
        {
          date: date,
          timeSlots: [createTimeSlot(date, defaultStartTime)],
          isRecurring: false,
        },
      ]);
    }
  };

  const addTimeSlot = (dateIndex: number) => {
    const schedule = selectedDates[dateIndex];
    const lastSlot = schedule.timeSlots[schedule.timeSlots.length - 1];

    const newSchedules = [...selectedDates];
    newSchedules[dateIndex].timeSlots.push(
      createTimeSlot(schedule.date, lastSlot.endTime)
    );
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

  const updateTime = (
    dateIndex: number,
    slotIndex: number,
    field: "startTime" | "endTime",
    newTime: string
  ) => {
    const newSchedules = [...selectedDates];
    const slot = newSchedules[dateIndex].timeSlots[slotIndex];
    const schedule = newSchedules[dateIndex];

    if (isToday(schedule.date)) {
      const now = new Date();
      const newDateTime = new Date(schedule.date);
      const [hours, minutes] = newTime.split(":").map(Number);
      newDateTime.setHours(hours, minutes, 0, 0);

      if (isBefore(newDateTime, now)) return;
    }

    if (field === "startTime") {
      const [newHours, newMinutes] = newTime.split(":").map(Number);
      const [endHours, endMinutes] = slot.endTime.split(":").map(Number);
      const newTotalMinutes = newHours * 60 + newMinutes;
      const endTotalMinutes = endHours * 60 + endMinutes;

      if (newTotalMinutes >= endTotalMinutes) {
        const newEndMinutes = newTotalMinutes + 15;
        const adjustedEndHours = Math.floor(newEndMinutes / 60) % 24;
        const adjustedEndMinutes = newEndMinutes % 60;
        slot.endTime = `${adjustedEndHours
          .toString()
          .padStart(2, "0")}:${adjustedEndMinutes.toString().padStart(2, "0")}`;
      }
      slot.startTime = newTime;
    } else {
      const [startHours, startMinutes] = slot.startTime.split(":").map(Number);
      const [newHours, newMinutes] = newTime.split(":").map(Number);
      const startTotalMinutes = startHours * 60 + startMinutes;
      const newTotalMinutes = newHours * 60 + newMinutes;

      if (newTotalMinutes <= startTotalMinutes) return;
      slot.endTime = newTime;
    }

    setSelectedDates(newSchedules);
  };

  const convertToUTC = () => {
    return selectedDates.map((schedule) => {
      const scheduleDate = schedule.date;

      return {
        date: scheduleDate.toISOString(),
        timeSlots: schedule.timeSlots.map((slot) => {
          const [startHours, startMinutes] = slot.startTime
            .split(":")
            .map(Number);
          const startDate = new Date(scheduleDate);
          startDate.setHours(startHours, startMinutes, 0, 0);

          const [endHours, endMinutes] = slot.endTime.split(":").map(Number);
          const endDate = new Date(scheduleDate);
          endDate.setHours(endHours, endMinutes, 0, 0);

          return {
            startTime: startDate.toISOString(),
            endTime: endDate.toISOString(),
            id: slot.id,
          };
        }),
        isRecurring: schedule.isRecurring,
      };
    });
  };

  const handleSave = () => {
    const utcSchedule = convertToUTC();
    console.log("Local Schedule:", selectedDates);
    console.log("UTC Schedule:", utcSchedule);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 bg-gray-50 min-h-screen">
      <div className="space-y-2 mb-6">
        <h1 className="text-3xl font-bold text-gray-900">
          Schedule Availability
        </h1>
        <p className="text-sm text-gray-500">All times shown in {timezone}</p>
      </div>

      <div className="flex gap-6">
        {/* Fixed Calendar Section */}
        <div className="w-[350px] h-fit sticky top-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <div className="mb-4 flex justify-between items-center">
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.setMonth(currentDate.getMonth() - 1))
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <h2 className="text-base font-semibold text-gray-900">
                {format(currentDate, "MMMM yyyy")}
              </h2>
              <button
                onClick={() =>
                  setCurrentDate(
                    new Date(currentDate.setMonth(currentDate.getMonth() + 1))
                  )
                }
                className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            <div className="grid grid-cols-7 gap-1">
              {["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"].map((day) => (
                <div
                  key={day}
                  className="text-center text-sm font-medium text-gray-500 p-2"
                >
                  {day}
                </div>
              ))}
              {generateCalendarDays().map((date, index) => (
                <div key={index} className="aspect-square p-0.5">
                  {date && (
                    <button
                      onClick={() => toggleDateSelection(date)}
                      disabled={isDateDisabled(date)}
                      className={`w-full h-full flex items-center justify-center rounded-full text-sm transition-all
                    ${
                      isDateSelected(date)
                        ? "bg-blue-600 text-white hover:bg-blue-700"
                        : isDateDisabled(date)
                        ? "text-gray-300 cursor-not-allowed"
                        : "hover:bg-gray-100 text-gray-700"
                    }
                    ${isToday(date) ? "font-bold ring-2 ring-blue-200" : ""}`}
                    >
                      {date.getDate()}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Save Button moved to sidebar */}
          <button
            onClick={handleSave}
            disabled={selectedDates.length === 0}
            className={`w-full mt-4 py-3 px-4 rounded-xl text-base font-medium transition-all ${
              selectedDates.length === 0
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-blue-600 text-white hover:bg-blue-700 shadow-sm hover:shadow"
            }`}
          >
            Save Schedule
          </button>
        </div>

        {/* Scrollable Time Slots Section */}
        <div className="flex-1 space-y-4 max-h-[calc(100vh-8rem)] overflow-y-auto rounded-xl">
          {selectedDates.length > 0 ? (
            <div className="space-y-4 p-1">
              {selectedDates
                .sort((a, b) => a.date.getTime() - b.date.getTime())
                .map((schedule, dateIndex) => (
                  <div
                    key={schedule.date.toISOString()}
                    className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 transition-all hover:shadow-md"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="bg-blue-50 p-2 rounded-lg">
                          <CalendarIcon className="text-blue-600" size={20} />
                        </div>
                        <span className="font-semibold text-gray-900">
                          {format(schedule.date, "EEEE, MMMM d, yyyy")}
                        </span>
                      </div>
                      <button
                        onClick={() => toggleRecurring(dateIndex)}
                        className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                          schedule.isRecurring
                            ? "bg-blue-50 text-blue-600 hover:bg-blue-100"
                            : "text-gray-600 hover:bg-gray-100"
                        }`}
                      >
                        <Repeat size={18} />
                        <span className="text-sm font-medium">Monthly</span>
                      </button>
                    </div>

                    <div className="space-y-3 ml-12">
                      {schedule.timeSlots.map((slot, slotIndex) => (
                        <div
                          key={slot.id}
                          className="flex items-center space-x-4 group"
                        >
                          <Clock className="text-gray-400" size={18} />
                          <div className="flex items-center space-x-3 text-black">
                            <select
                              value={slot.startTime}
                              onChange={(e) =>
                                updateTime(
                                  dateIndex,
                                  slotIndex,
                                  "startTime",
                                  e.target.value
                                )
                              }
                              className="border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            >
                              {generateTimeOptions(schedule.date).map(
                                (time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                )
                              )}
                            </select>
                            <span className="text-sm text-gray-500">to</span>
                            <select
                              value={slot.endTime}
                              onChange={(e) =>
                                updateTime(
                                  dateIndex,
                                  slotIndex,
                                  "endTime",
                                  e.target.value
                                )
                              }
                              className="border border-gray-200 rounded-lg px-3 py-2 pr-10 text-sm bg-white hover:border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
                            >
                              {generateTimeOptions(schedule.date).map(
                                (time) => (
                                  <option key={time} value={time}>
                                    {time}
                                  </option>
                                )
                              )}
                            </select>
                          </div>
                          <button
                            onClick={() => removeTimeSlot(dateIndex, slotIndex)}
                            className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                          >
                            <Trash2 size={18} />
                          </button>
                        </div>
                      ))}

                      <button
                        onClick={() => addTimeSlot(dateIndex)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 text-sm mt-4 px-3 py-2 rounded-lg hover:bg-blue-50 transition-all"
                      >
                        <Plus size={18} />
                        <span className="font-medium">Add time slot</span>
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          ) : (
            <div className="bg-white rounded-xl p-8 text-center border border-gray-200">
              <div className="text-gray-400 mb-3">
                <CalendarIcon className="w-12 h-12 mx-auto" />
              </div>
              <p className="text-gray-600 font-medium">
                Select dates from the calendar to schedule availability
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DateSpecificScheduler;
