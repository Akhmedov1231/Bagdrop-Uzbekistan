/**
 * These types are hand-written to match supabase/migrations/0001_schema.sql.
 *
 * Once your Supabase project is connected, regenerate the real thing with:
 *   npx supabase gen types typescript --project-id <your-project-ref> > src/lib/supabase/types.ts
 * and it will produce a very similar (more complete) version of this file.
 */

export type UserRole = "customer" | "partner" | "admin";

export type BookingStatus =
  | "PENDING_PAYMENT"
  | "PAID"
  | "CHECKED_IN"
  | "COMPLETED"
  | "CANCELLED"
  | "REFUNDED"
  | "EXPIRED";

export type BagStatus = "PENDING" | "CHECKED_IN" | "CHECKED_OUT";

export type PaymentProvider = "click" | "payme" | "dev_simulator";
export type PaymentStatus = "pending" | "paid" | "failed" | "refunded";

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          email: string;
          phone: string | null;
          role: UserRole;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          email: string;
          phone?: string | null;
          role?: UserRole;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["users"]["Insert"]>;
      };
      partners: {
        Row: {
          id: string;
          business_name: string;
          contact_name: string;
          phone: string | null;
          email: string | null;
          commission_type: "percent" | "fixed";
          commission_value: number;
          active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          business_name: string;
          contact_name: string;
          phone?: string | null;
          email?: string | null;
          commission_type?: "percent" | "fixed";
          commission_value?: number;
          active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["partners"]["Insert"]>;
      };
      partner_users: {
        Row: {
          id: string;
          partner_id: string;
          user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          user_id: string;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["partner_users"]["Insert"]>;
      };
      locations: {
        Row: {
          id: string;
          partner_id: string;
          city: string;
          name: string;
          slug: string;
          address: string;
          latitude: number;
          longitude: number;
          description: string | null;
          price_per_bag: number;
          capacity: number;
          opening_time: string;
          closing_time: string;
          active: boolean;
          google_maps_url: string | null;
          yandex_maps_url: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_id: string;
          city: string;
          name: string;
          slug: string;
          address: string;
          latitude: number;
          longitude: number;
          description?: string | null;
          price_per_bag: number;
          capacity: number;
          opening_time?: string;
          closing_time?: string;
          active?: boolean;
          google_maps_url?: string | null;
          yandex_maps_url?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["locations"]["Insert"]>;
      };
      bookings: {
        Row: {
          id: string;
          booking_number: string;
          access_token: string;
          customer_id: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          location_id: string;
          dropoff_date: string;
          pickup_date: string;
          dropoff_time: string;
          pickup_time: string;
          bag_count: number;
          price_per_bag: number;
          total_amount: number;
          currency: string;
          status: BookingStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_number: string;
          access_token?: string;
          customer_id?: string | null;
          customer_name: string;
          customer_email: string;
          customer_phone: string;
          location_id: string;
          dropoff_date: string;
          pickup_date: string;
          dropoff_time: string;
          pickup_time: string;
          bag_count: number;
          price_per_bag: number;
          total_amount: number;
          currency?: string;
          status?: BookingStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bookings"]["Insert"]>;
      };
      bags: {
        Row: {
          id: string;
          booking_id: string;
          tag_number: string;
          status: BagStatus;
          checked_in_at: string | null;
          checked_out_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          tag_number: string;
          status?: BagStatus;
          checked_in_at?: string | null;
          checked_out_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["bags"]["Insert"]>;
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          provider: PaymentProvider;
          provider_transaction_id: string | null;
          amount: number;
          currency: string;
          status: PaymentStatus;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          provider: PaymentProvider;
          provider_transaction_id?: string | null;
          amount: number;
          currency?: string;
          status?: PaymentStatus;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["payments"]["Insert"]>;
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata: Record<string, unknown> | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id: string;
          metadata?: Record<string, unknown> | null;
          created_at?: string;
        };
        Update: Partial<Database["public"]["Tables"]["audit_logs"]["Insert"]>;
      };
    };
  };
}
