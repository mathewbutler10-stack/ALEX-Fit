import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST(
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

    // Parse request body
    const body = await request.json();
    const { client_id, rating, feedback, quick_feedback } = body;

    if (!client_id || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: 'Missing or invalid required fields: client_id and rating (1-5)' },
        { status: 400 }
      );
    }

    const mealId = params.id;

    // Verify client exists and belongs to user (if user is PT)
    const { data: client, error: clientError } = await supabase
      .from('clients')
      .select('id, assigned_pt_id')
      .eq('id', client_id)
      .single();

    if (clientError || !client) {
      return NextResponse.json(
        { error: 'Client not found' },
        { status: 404 }
      );
    }

    // Check if user is the client or their PT
    if (user.id !== client_id && user.id !== client.assigned_pt_id) {
      return NextResponse.json(
        { error: 'You do not have permission to rate meals for this client' },
        { status: 403 }
      );
    }

    // Check if meal exists
    const { data: meal, error: mealError } = await supabase
      .from('meal_library')
      .select('id')
      .eq('id', mealId)
      .single();

    if (mealError || !meal) {
      return NextResponse.json(
        { error: 'Meal not found' },
        { status: 404 }
      );
    }

    // Check for existing rating
    const { data: existingRating, error: existingError } = await supabase
      .from('meal_ratings')
      .select('id')
      .eq('client_id', client_id)
      .eq('meal_id', mealId)
      .single();

    let ratingId;
    
    if (existingError && existingError.code !== 'PGRST116') {
      // Error other than "not found"
      throw existingError;
    }

    if (existingRating) {
      // Update existing rating
      const { data: updated, error: updateError } = await supabase
        .from('meal_ratings')
        .update({
          rating,
          feedback,
          quick_feedback,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingRating.id)
        .select()
        .single();

      if (updateError) throw updateError;
      ratingId = updated.id;
    } else {
      // Create new rating
      const { data: newRating, error: insertError } = await supabase
        .from('meal_ratings')
        .insert({
          client_id,
          meal_id: mealId,
          rating,
          feedback,
          quick_feedback,
        })
        .select()
        .single();

      if (insertError) throw insertError;
      ratingId = newRating.id;
    }

    // The database trigger will automatically update the meal's average_rating and rating_count

    return NextResponse.json({
      id: ratingId,
      message: 'Rating submitted successfully',
    }, { status: existingRating ? 200 : 201 });
  } catch (error) {
    console.error('Error submitting rating:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}