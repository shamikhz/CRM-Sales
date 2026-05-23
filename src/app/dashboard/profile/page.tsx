'use client';

import { useAuthStore } from '@/store';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, Phone, Mail, MapPin, Shield, LogOut } from 'lucide-react';
import { signOut } from '@/firebase/auth';
import { auth } from '@/firebase/config';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user } = useAuthStore();
  const router = useRouter();

  if (!user) return null;

  return (
    <div className="p-4 pb-24 space-y-6 h-full flex flex-col">
      <header className="flex items-center justify-between pt-2">
        <h1 className="text-2xl font-bold tracking-tight">Profile</h1>
      </header>

      <div className="flex flex-col items-center text-center mt-4">
        <div className="relative">
          <Avatar className="w-24 h-24 border-4 border-background shadow-xl">
            <AvatarImage src={user.profileImage} />
            <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
              {user.name?.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="absolute bottom-0 right-0 p-1.5 bg-emerald-500 rounded-full border-2 border-background" />
        </div>
        <h2 className="text-xl font-bold mt-4">{user.name}</h2>
        <p className="text-muted-foreground">{user.role === 'sales-executive' ? 'Sales Executive' : user.role}</p>
      </div>

      <div className="space-y-4 flex-1">
        <Card className="glass-card border-none shadow-sm">
          <CardContent className="p-0">
            <div className="flex items-center p-4 border-b border-border/50">
              <Mail className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium">Email Address</p>
                <p className="text-sm text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center p-4 border-b border-border/50">
              <Phone className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium">Phone Number</p>
                <p className="text-sm text-muted-foreground">{user.phone || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center p-4 border-b border-border/50">
              <MapPin className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium">Assigned Region</p>
                <p className="text-sm text-muted-foreground">{user.assignedRegion || 'Not set'}</p>
              </div>
            </div>
            <div className="flex items-center p-4">
              <Shield className="w-5 h-5 text-muted-foreground mr-3" />
              <div>
                <p className="text-sm font-medium">Account ID</p>
                <p className="text-xs text-muted-foreground font-mono">{user.uid}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button 
          variant="destructive" 
          className="w-full rounded-xl h-12 font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none mt-8"
          onClick={() => {
            signOut().then(() => router.push('/'));
          }}
        >
          <LogOut className="w-5 h-5 mr-2" />
          Sign Out
        </Button>
      </div>
    </div>
  );
}
