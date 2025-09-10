import { useState } from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Calendar, Edit, Trash2, Plus, AlertTriangle } from "lucide-react";

interface Holiday {
  name: string;
  startDate: string;
  endDate: string;
}

interface HolidayListProps {
  holidays: Holiday[];
  termStartDate: string;
  termEndDate: string;
  onAddHoliday: () => void;
  onEditHoliday: (index: number) => void;
  onDeleteHoliday: (index: number) => void;
}

export default function HolidayList({
  holidays,
  termStartDate,
  termEndDate,
  onAddHoliday,
  onEditHoliday,
  onDeleteHoliday,
}: HolidayListProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getHolidayDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1; // +1 to include both start and end dates
    return diffDays;
  };

  const isHolidayOverlapping = (holiday: Holiday, index: number) => {
    const holidayStart = new Date(holiday.startDate);
    const holidayEnd = new Date(holiday.endDate);

    for (let i = 0; i < holidays.length; i++) {
      if (i === index) continue;

      const otherStart = new Date(holidays[i].startDate);
      const otherEnd = new Date(holidays[i].endDate);

      // Check for overlap
      if (holidayStart <= otherEnd && holidayEnd >= otherStart) {
        return true;
      }
    }
    return false;
  };

  if (holidays.length === 0) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center py-8">
            <div className="mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
              <Calendar className="w-6 h-6 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No holidays added</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add holidays to mark non-school days during this term.
            </p>
            <Button onClick={onAddHoliday} variant="outline">
              <Plus className="w-4 h-4 mr-2" />
              Add First Holiday
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="w-5 h-5" />
            Holidays ({holidays.length})
          </CardTitle>
          <Button onClick={onAddHoliday} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Holiday
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {holidays.map((holiday, index) => {
            const duration = getHolidayDuration(
              holiday.startDate,
              holiday.endDate
            );
            const hasOverlap = isHolidayOverlapping(holiday, index);

            return (
              <div
                key={index}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  hasOverlap ? "border-red-200 bg-red-50" : "border-gray-200"
                }`}
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h4 className="font-medium text-foreground">
                      {holiday.name}
                    </h4>
                    {hasOverlap && (
                      <Badge variant="destructive" className="text-xs">
                        <AlertTriangle className="w-3 h-3 mr-1" />
                        Overlap
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                    <span>
                      {formatDate(holiday.startDate)} -{" "}
                      {formatDate(holiday.endDate)}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {duration} {duration === 1 ? "day" : "days"}
                    </Badge>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEditHoliday(index)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onDeleteHoliday(index)}
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {holidays.some((holiday, index) =>
          isHolidayOverlapping(holiday, index)
        ) && (
          <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 text-red-800">
              <AlertTriangle className="w-4 h-4" />
              <span className="text-sm font-medium">
                Holiday Overlap Warning
              </span>
            </div>
            <p className="text-sm text-red-700 mt-1">
              Some holidays overlap with each other. This may cause confusion in
              scheduling.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
