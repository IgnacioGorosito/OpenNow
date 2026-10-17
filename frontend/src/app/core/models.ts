export interface Locality {
  id: number;
  name: string;
  province: string | null;
}

export interface Category {
  id: number;
  name: string;
  icon: string | null;
}

export interface Schedule {
  day_of_week: number;
  open_time: string;
  close_time: string;
}

export interface Place {
  id: number;
  name: string;
  address: string | null;
  phone: string | null;
  email: string | null;
  description: string | null;
  latitude: number | null;
  longitude: number | null;
  owner_name: string | null;
  category: { id: number; name: string; icon: string | null };
  locality: { id: number; name: string; province: string | null };
  schedules: Schedule[];
  is_open: boolean;
}