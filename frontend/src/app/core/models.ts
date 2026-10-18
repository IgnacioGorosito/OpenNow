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
  latitude: string | null;
  longitude: string | null;
  owner_name: string | null;
  category: Category;
  locality: Locality;
  schedules: Schedule[];
  is_open: boolean;
}