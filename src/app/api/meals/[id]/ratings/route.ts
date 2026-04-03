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

    const mealId = params.id;

    // Check if meal exists
    const { data: meal, error: mealError } = await supabase
      .from('meal_library')
      .select('id, gym_id')
      .eq('id', mealId)
      .single();

    if (mealError || !meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Get user's role and gym
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

    // Build query based on user role
    let query = supabase
      .from('meal_ratings')
      .select(`
        *,
        client:clients(
          id,
          user:users!clients_user_id_fkey(
            id,
            full_name
          )
        )
      `)
      .eq('meal_id', mealId);

    // Apply filters based on user role
    if (userProfile.role === 'client') {
      // Clients can only see their own ratings
      query = query.eq('client_id', user.id);
    } else if (userProfile.role === 'pt') {
      // PTs can see ratings from their clients
      query = query.in('client_id', 
        supabase
          .from('clients')
          .select('id')
          .eq('assigned_pt_id', user.id)
          .eq('gym_id', userProfile.gym_id)
      );
    } else if (userProfile.role === 'owner') {
      // Owners can see all ratings in their gym
      query = query.in('client_id',
        supabase
          .from('clients')
          .select('id')
          .eq('gym_id', userProfile.gym_id)
      );
    }

    // Apply pagination
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: ratings, error: ratingsError, count } = await query
      .range(offset, offset + limit - 1)
      .order('created_at', { ascending: false });

    if (ratingsError) throw ratingsError;

    // Get meal details including average rating
    const { data: mealDetails, error: detailsError } = await supabase
      .from('meal_library')
      .select('name, average_rating, rating_count')
      .eq('id', mealId)
      .single();

    if (detailsError) throw detailsError;

    return NextResponse.json({
      meal: {
        id: mealId,
        name: mealDetails.name,
        average_rating: mealDetails.average_rating,
        rating_count: mealDetails.rating_count,
      },
      ratings,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching ratings:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}