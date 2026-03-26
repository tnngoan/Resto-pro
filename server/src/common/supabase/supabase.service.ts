import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService implements OnModuleInit {
  private readonly logger = new Logger(SupabaseService.name);
  private client: SupabaseClient;
  private adminClient: SupabaseClient;

  constructor(private readonly configService: ConfigService) {}

  onModuleInit(): void {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');
    const supabaseServiceKey = this.configService.get<string>('SUPABASE_SERVICE_KEY');

    // Public client (respects RLS policies — use for customer-facing operations)
    this.client = createClient(supabaseUrl, supabaseAnonKey);

    // Admin client (bypasses RLS — use for server-side operations)
    if (supabaseServiceKey && supabaseServiceKey !== 'your_supabase_service_role_key_here') {
      this.adminClient = createClient(supabaseUrl, supabaseServiceKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      });
      this.logger.log('Supabase admin client initialized');
    } else {
      this.logger.warn('Supabase service key not configured — admin client unavailable');
      this.adminClient = this.client;
    }

    this.logger.log('Supabase client initialized');
  }

  /**
   * Public Supabase client — respects Row Level Security.
   * Use for customer-facing operations (QR ordering, menu browsing).
   */
  getClient(): SupabaseClient {
    return this.client;
  }

  /**
   * Admin Supabase client — bypasses Row Level Security.
   * Use for server-side operations (order processing, reports, inventory).
   */
  getAdminClient(): SupabaseClient {
    return this.adminClient;
  }

  /**
   * Get a client authenticated as a specific user.
   * Use when you need RLS to scope data to a restaurant.
   */
  getClientForUser(accessToken: string): SupabaseClient {
    const supabaseUrl = this.configService.getOrThrow<string>('SUPABASE_URL');
    const supabaseAnonKey = this.configService.getOrThrow<string>('SUPABASE_ANON_KEY');

    return createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    });
  }
}
