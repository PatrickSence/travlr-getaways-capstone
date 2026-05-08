export interface Booking {
  _id?: string;
  tripCode: string;
  tripName?: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  travelers?: number;
  notes?: string;
  bookedAt?: string;
}