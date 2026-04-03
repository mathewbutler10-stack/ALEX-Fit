import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const clientId = params.id;

    // Verify client exists
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, assigned_pt_id, gym_id')
      .eq('id', clientId)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check permissions
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('role, gym_id')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      );
    }

    let hasPermission = false;

    if (userProfile.role === 'client' && user.id === clientId) {
      // Clients can see their own ratings
      hasPermission = true;
    } else if (userProfile.role === 'pt' && user.id === client.assigned_pt_id) {
      // PTs can see ratings from their clients
      hasPermission = true;
    } else if (userProfile.role === 'owner' && userProfile.gym_id === client.gym_id) {
      // Owners can see ratings from clients in their gym
      hasPermission = true;
    }

    if (!hasPermission) {
      return NextResponse.json(
        { error: 'You do not have permission to view these ratings' },
        { status: 403 }
      );
    }

    // Build query
    let query = supabase
      .from('meal_ratings')
      .select(`
        *,
        meal:meal_library(
          id,
          name,
          meal_type,
          cuisine,
          difficulty,
          prep_time_minutes,
          calories,
          dietary_flags,
          average_rating,
          rating_count
        )
      `)
      .eq('client_id', clientId);

    // Apply filters from query parameters
    const { searchParams } = new URL(request.url);
    
    const mealType = searchParams.get('meal_type');
    if (mealType) {
      query = query.eq('meal.meal_type', mealType);
    }

    const minRating = searchParams.get('min_rating');
    if (minRating) {
      query = query.gte('rating', parseFloat(minRating));
    }

    const maxRating = searchParams.get('max_rating');
    if (maxRating) {
      query = query.lte('rating', parseFloat(maxRating));
    }

    const startDate = searchParams.get('start_date');
    if (startDate) {
      query = query.gte('created_at', startDate);
    }

    const endDate = searchParams.get('end_date');
    if (endDate) {
      query = query.lte('created_at', endDate);
    }

    const hasFeedback = searchParams.get('has_feedback');
    if (hasFeedback === 'true') {
      query = query.not('feedback', 'is', null);
    } else if (hasFeedback === 'false') {
      query = query.is('feedback', null);
    }

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: ratings, error: ratingsError, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (ratingsError) throw ratingsError;

    // Calculate statistics
    const stats = {
      total_ratings: count || 0,
      average_rating: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      meal_type_distribution: {} as Record<string, number>,
      has_feedback_count: 0,
    };

    if (ratings && ratings.length > 0) {
      // Calculate average rating
      const totalRating = ratings.reduce((sum, rating) => sum + rating.rating, 0);
      stats.average_rating = totalRating / ratings.length;

      // Calculate rating distribution
      ratings.forEach(rating => {
        stats.rating_distribution[rating.rating as keyof typeof stats.rating_distribution]++;
        
        // Count meal types
        const mealType = rating.meal?.meal_type;
        if (mealType) {
          stats.meal_type_distribution[mealType] = (stats.meal_type_distribution[mealType] || 0) + 1;
        }

        // Count feedback
        if (rating.feedback) {
          stats.has_feedback_count++;
        }
      });
    }

    return NextResponse.json({
      client: {
        id: clientId,
        total_ratings: stats.total_ratings,
        average_rating: stats.average_rating,
      },
      ratings,
      statistics: stats,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching client meal ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}