'use client';

import { useEffect, useState } from 'react';
import { useAuthStore, useAttendanceStore } from '@/store';
import { subscribeToCollection, createDocument, updateDocument, Timestamp } from '@/firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Clock, Loader2, MapPin, CheckCircle2, History } from 'lucide-react';
import { COLLECTIONS } from '@/lib/constants';
import type { AttendanceRecord } from '@/types';
import { format, differenceInMinutes } from 'date-fns';
import { toast } from 'sonner';

export default function AttendancePage() {
  const { user } = useAuthStore();
  const { isCheckedIn, currentSessionId, checkInTime, setCheckedIn } = useAttendanceStore();
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (!user) return;
    const unsub = subscribeToCollection(COLLECTIONS.ATTENDANCE, (data) => {
      const allRecords = data as AttendanceRecord[];
      const myRecords = allRecords.filter(r => r.userId === user.uid);
      const sorted = myRecords.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
      
      setRecords(sorted);
      
      // Update global store if we find an active session
      const activeSession = sorted.find(r => !r.checkOut);
      if (activeSession) {
        setCheckedIn(true, activeSession.id, activeSession.checkIn);
      } else {
        setCheckedIn(false);
      }
      
      setIsLoading(false);
    });
    return () => unsub();
  }, [user, setCheckedIn]);

  const handleAttendance = async () => {
    if (!user) return;
    setIsProcessing(true);

    try {
      if (!navigator.geolocation) {
        throw new Error('Geolocation is not supported by your browser');
      }

      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { 
          enableHighAccuracy: true,
          timeout: 10000 
        });
      });

      const gpsLocation = {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };

      const now = new Date();

      if (isCheckedIn && currentSessionId && checkInTime) {
        // Check Out
        const duration = differenceInMinutes(now, checkInTime);
        await updateDocument(COLLECTIONS.ATTENDANCE, currentSessionId, {
          checkOut: Timestamp.fromDate(now),
          workDuration: duration
        });
        toast.success('Successfully checked out');
      } else {
        // Check In
        const dateStr = format(now, 'yyyy-MM-dd');
        await createDocument(COLLECTIONS.ATTENDANCE, {
          userId: user.uid,
          userName: user.name,
          checkIn: Timestamp.fromDate(now),
          checkOut: null,
          gpsLocation,
          workDuration: 0,
          attendanceStatus: 'present',
          date: dateStr
        });
        toast.success('Successfully checked in');
      }
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Failed to process attendance. Please ensure location services are enabled.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="p-4 pb-24 space-y-6 h-full flex flex-col">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Attendance</h1>
      </header>

      {/* Current Status Card */}
      <Card className="glass-card border-none shadow-lg bg-gradient-to-br from-primary/10 to-indigo-500/10 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none" />
        <CardContent className="p-6 relative z-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-background shadow-inner flex items-center justify-center mb-4">
            {isCheckedIn ? (
              <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-in zoom-in duration-500" />
            ) : (
              <Clock className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          
          <h2 className="text-xl font-bold mb-1">
            {isCheckedIn ? 'Currently Checked In' : 'Not Checked In'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6">
            {isCheckedIn ? 'Your session is active and being tracked.' : 'Ready to start your day?'}
          </p>

          <Button 
            onClick={handleAttendance}
            disabled={isProcessing}
            className={`w-full h-14 rounded-xl font-bold text-lg text-white shadow-lg transition-transform active:scale-[0.98] ${
              isCheckedIn 
                ? 'bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 shadow-red-500/25' 
                : 'animated-gradient shadow-primary/25'
            }`}
          >
            {isProcessing ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              <>
                <MapPin className="w-5 h-5 mr-2" />
                {isCheckedIn ? 'Check Out' : 'Check In Now'}
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-3 flex items-center justify-center">
            <MapPin className="w-3 h-3 mr-1" /> Requires GPS Location
          </p>
        </CardContent>
      </Card>

      {/* History List */}
      <div className="flex-1 flex flex-col">
        <div className="flex items-center mb-3 text-muted-foreground font-medium text-sm">
          <History className="w-4 h-4 mr-2" />
          Recent History
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar -mx-2 px-2 pb-4">
          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : records.length === 0 ? (
            <div className="text-center p-8 text-muted-foreground bg-muted/30 rounded-2xl">
              <p>No attendance records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {records.map(record => (
                <Card key={record.id} className="glass-card border-none shadow-sm">
                  <CardContent className="p-4">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-semibold">{format(record.checkIn, 'EEEE, MMM d, yyyy')}</h3>
                        <p className="text-sm text-muted-foreground mt-0.5">
                          {format(record.checkIn, 'h:mm a')} - {record.checkOut ? format(record.checkOut, 'h:mm a') : 'Active'}
                        </p>
                      </div>
                      <Badge variant={record.attendanceStatus === 'present' ? 'default' : 'secondary'} className={record.attendanceStatus === 'present' ? 'bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500/20' : ''}>
                        {record.attendanceStatus}
                      </Badge>
                    </div>
                    
                    {record.checkOut && (
                      <div className="flex items-center text-xs font-medium text-primary bg-primary/10 w-fit px-2 py-1 rounded-md">
                        <Clock className="w-3.5 h-3.5 mr-1.5" />
                        Duration: {Math.floor(record.workDuration / 60)}h {record.workDuration % 60}m
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
