"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Calendar as CalendarIcon, Users, BedDouble, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "./ui/card";
import { roomCategories } from "@/lib/mock-data";

interface RoomsFilterBarProps {
    onSearch: (filters: {
        checkIn?: Date;
        checkOut?: Date;
        guests: string;
        roomType: string;
    }) => void;
    initialValues: {
        checkInDate?: Date;
        checkOutDate?: Date;
        guests: string;
        roomType: string;
    }
}

export function RoomsFilterBar({ onSearch, initialValues }: RoomsFilterBarProps) {
  const [checkInDate, setCheckInDate] = useState<Date | undefined>(initialValues.checkInDate);
  const [checkOutDate, setCheckOutDate] = useState<Date | undefined>(initialValues.checkOutDate);
  const [guests, setGuests] = useState<string>(initialValues.guests);
  const [roomType, setRoomType] = useState<string>(initialValues.roomType);

  const handleSearchClick = () => {
    onSearch({ checkIn: checkInDate, checkOut: checkOutDate, guests, roomType });
  };

  return (
    <Card className="p-4 md:p-6 shadow-lg bg-card">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
        <div className="space-y-2">
          <label htmlFor="check-in" className="text-sm font-medium text-muted-foreground">Check-in Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="check-in"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-12 text-base",
                  !checkInDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkInDate ? format(checkInDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkInDate}
                onSelect={setCheckInDate}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label htmlFor="check-out" className="text-sm font-medium text-muted-foreground">Check-out Date</label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                id="check-out"
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal h-12 text-base",
                  !checkOutDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {checkOutDate ? format(checkOutDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={checkOutDate}
                onSelect={setCheckOutDate}
                disabled={(date) =>
                  date < (checkInDate || new Date(new Date().setHours(0, 0, 0, 0)))
                }
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div className="space-y-2">
          <label htmlFor="guests" className="text-sm font-medium text-muted-foreground">Guests</label>
          <Select value={guests} onValueChange={setGuests}>
            <SelectTrigger id="guests" className="h-12 text-base">
              <Users className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select guests" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1">1 Guest</SelectItem>
              <SelectItem value="2">2 Guests</SelectItem>
              <SelectItem value="3">3 Guests</SelectItem>
              <SelectItem value="4">4+ Guests</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="room-type" className="text-sm font-medium text-muted-foreground">Room Type</label>
          <Select value={roomType} onValueChange={setRoomType}>
            <SelectTrigger id="room-type" className="h-12 text-base">
              <BedDouble className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Select room type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              {roomCategories.map(cat => (
                 <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSearchClick} size="lg" className="w-full h-12 text-base font-bold lg:col-span-1">
          <Search className="mr-2 h-5 w-5" />
          Search
        </Button>
      </div>
    </Card>
  );
}
