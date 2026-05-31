export type Role = 'user' | 'creator';

export type SessionStatus = 'draft' | 'published' | 'cancelled' | 'completed';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';

export interface User {
  id: number;
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  role: Role;
  avatar: string | null;
  bio: string;
  is_creator: boolean;
  date_joined: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Session {
  id: number;
  creator: User;
  title: string;
  description: string;
  category: Category | null;
  cover_image: string | null;
  price: string;
  is_free: boolean;
  capacity: number;
  available_spots: number;
  is_fully_booked: boolean;
  confirmed_bookings_count: number;
  scheduled_at: string;
  duration_minutes: number;
  status: SessionStatus;
  tags: string;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: number;
  session: Session;
  user: User;
  status: BookingStatus;
  payment_status: string;
  stripe_payment_intent_id: string;
  notes: string;
  can_cancel: boolean;
  booked_at: string;
  cancelled_at: string | null;
}

export interface AuthTokens {
  access: string;
  refresh: string;
}

export interface AuthResponse extends AuthTokens {
  user: User;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface SessionFilters {
  search?: string;
  category?: string;
  is_free?: boolean;
  available_only?: boolean;
  page?: number;
  ordering?: string;
}

export interface SessionFormValues {
  title: string;
  description: string;
  category: number | null;
  cover_image: string | null;
  price: string;
  capacity: number;
  scheduled_at: string;
  duration_minutes: number;
  tags: string;
  status: SessionStatus;
}
