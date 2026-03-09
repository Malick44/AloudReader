export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

type Timestamp = string;

export type Database = {
  public: {
    Tables: {
      documents: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          body: string;
          language: string;
          source_type: 'pdf' | 'article' | 'note';
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          body: string;
          language: string;
          source_type: 'pdf' | 'article' | 'note';
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<{
          title: string;
          body: string;
          language: string;
          source_type: 'pdf' | 'article' | 'note';
          updated_at: Timestamp;
        }>;
      };
      bookmarks: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          position_chars: number;
          note: string | null;
          created_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          position_chars: number;
          note?: string | null;
          created_at?: Timestamp;
        };
        Update: Partial<{
          position_chars: number;
          note: string | null;
        }>;
      };
      reading_history: {
        Row: {
          id: string;
          user_id: string;
          document_id: string;
          progress_chars: number;
          updated_at: Timestamp;
        };
        Insert: {
          id?: string;
          user_id: string;
          document_id: string;
          progress_chars: number;
          updated_at?: Timestamp;
        };
        Update: Partial<{
          progress_chars: number;
          updated_at: Timestamp;
        }>;
      };
      profiles: {
        Row: {
          id: string;
          display_name: string | null;
          preferred_voice_model_id: string | null;
          preferred_language: string;
          created_at: Timestamp;
          updated_at: Timestamp;
        };
        Insert: {
          id: string;
          display_name?: string | null;
          preferred_voice_model_id?: string | null;
          preferred_language?: string;
          created_at?: Timestamp;
          updated_at?: Timestamp;
        };
        Update: Partial<{
          display_name: string | null;
          preferred_voice_model_id: string | null;
          preferred_language: string;
          updated_at: Timestamp;
        }>;
      };
    };
    Views: {
      document_cards: {
        Row: {
          id: string;
          title: string;
          language: string;
          source_type: 'pdf' | 'article' | 'note';
          updated_at: Timestamp;
        };
      };
    };
    Functions: {
      upsert_reading_history: {
        Args: {
          p_document_id: string;
          p_progress_chars: number;
        };
        Returns: {
          id: string;
          document_id: string;
          progress_chars: number;
          updated_at: string;
        };
      };
    };
  };
};
