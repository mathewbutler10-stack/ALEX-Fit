import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
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

    // Only PTs and owners can access insights
    if (!['pt', 'owner'].includes(userProfile.role)) {
      return NextResponse.json(
        { error: 'You do not have permission to access meal insights' },
        { status: 403 }
      );
    }

    // Build query for meal insights
    let query = supabase
      .from('meal_insights')
      .select('*')
      .eq('gym_id', userProfile.gym_id);

    // Apply filters from query parameters
    const { searchParams } = new URL(request.url);
    
    const mealType = searchParams.get('meal_type');
    if (mealType) {
      query = query.eq('meal_type', mealType);
    }

    const cuisine = searchParams.get('cuisine');
    if (cuisine) {
      query = query.eq('cuisine', cuisine);
    }

    const minRating = searchParams.get('min_rating');
    if (minRating) {
      query = query.gte('average_rating', parseFloat(minRating));
    }

    const maxRating = searchParams.get('max_rating');
    if (maxRating) {
      query = query.lte('average_rating', parseFloat(maxRating));
    }

    const minServings = searchParams.get('min_servings');
    if (minServings) {
      query = query.gte('total_servings', parseInt(minServings));
    }

    const difficulty = searchParams.get('difficulty');
    if (difficulty) {
      query = query.eq('difficulty', difficulty);
    }

    // Apply sorting
    const sortBy = searchParams.get('sort_by') || 'average_rating';
    const sortOrder = searchParams.get('sort_order') || 'desc';
    
    query = query.order(sortBy, { ascending: sortOrder === 'asc' });

    // Apply pagination
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = (page - 1) * limit;

    const { data: insights, error: insightsError, count } = await query
      .range(offset, offset + limit - 1);

    if (insightsError) throw insightsError;

    // Calculate overall statistics
    const overallStats = {
      total_meals: count || 0,
      average_rating: 0,
      total_ratings: 0,
      total_servings: 0,
      rating_distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      meal_type_distribution: {} as Record<string, number>,
      cuisine_distribution: {} as Record<string, number>,
      difficulty_distribution: {} as Record<string, number>,
      quick_feedback_totals: {
        loved: 0,
        too_spicy: 0,
        will_make_again: 0,
        too_complicated: 0,
      },
    };

    if (insights && insights.length > 0) {
      insights.forEach(insight => {
        // Calculate averages
        overallStats.average_rating += insight.average_rating * insight.rating_count;
        overallStats.total_ratings += insight.rating_count;
        overallStats.total_servings += insight.total_servings;

        // Estimate rating distribution (simplified)
        const estimatedFiveStar = Math.round(insight.rating_count * (insight.average_rating / 5));
        overallStats.rating_distribution[5] += estimatedFiveStar;
        overallStats.rating_distribution[4] += insight.rating_count - estimatedFiveStar;

        // Count distributions
        overallStats.meal_type_distribution[insight.meal_type] = 
          (overallStats.meal_type_distribution[insight.meal_type] || 0) + 1;
        
        overallStats.cuisine_distribution[insight.cuisine] = 
          (overallStats.cuisine_distribution[insight.cuisine] || 0) + 1;
        
        overallStats.difficulty_distribution[insight.difficulty] = 
          (overallStats.difficulty_distribution[insight.difficulty] || 0) + 1;

        // Sum quick feedback
        if (insight.quick_feedback_counts) {
          overallStats.quick_feedback_totals.loved += insight.quick_feedback_counts.loved || 0;
          overallStats.quick_feedback_totals.too_spicy += insight.quick_feedback_counts.too_spicy || 0;
          overallStats.quick_feedback_totals.will_make_again += insight.quick_feedback_counts.will_make_again || 0;
          overallStats.quick_feedback_totals.too_complicated += insight.quick_feedback_counts.too_complicated || 0;
        }
      });

      // Calculate weighted average rating
      if (overallStats.total_ratings > 0) {
        overallStats.average_rating /= overallStats.total_ratings;
      }
    }

    // Get top performers (4.5+ stars)
    const topPerformers = insights
      .filter(insight => insight.average_rating >= 4.5)
      .sort((a, b) => b.average_rating - a.average_rating)
      .slice(0, 5);

    // Get needs improvement (< 3.5 stars)
    const needsImprovement = insights
      .filter(insight => insight.average_rating < 3.5)
      .sort((a, b) => a.average_rating - b.average_rating)
      .slice(0, 5);

    // Get most served meals
    const mostServed = [...insights]
      .sort((a, b) => b.total_servings - a.total_servings)
      .slice(0, 5);

    // Generate recommendations
    const recommendations = [];
    
    if (needsImprovement.length > 0) {
      recommendations.push({
        type: 'improvement',
        title: 'Review low-rated meals',
        description: `${needsImprovement.length} meals have ratings below 3.5 stars. Consider updating or removing these from rotation.`,
        priority: 'high',
      });
    }

    if (overallStats.quick_feedback_totals.too_complicated > 10) {
      recommendations.push({
        type: 'simplification',
        title: 'Simplify complex meals',
        description: `${overallStats.quick_feedback_totals.too_complicated} reports of meals being "too complicated". Consider adding simpler alternatives.`,
        priority: 'medium',
      });
    }

    if (topPerformers.length > 0) {
      const cuisineEntries: [string, number][] = Object.entries(
        topPerformers.reduce((acc, meal) => {
          if (meal.cuisine) {
            acc[meal.cuisine] = (acc[meal.cuisine] || 0) + 1;
          }
          return acc;
        }, {} as Record<string, number>)
      );
      
      const topCuisine = cuisineEntries.sort((a, b) => b[1] - a[1])[0];

      if (topCuisine) {
        const [cuisineName, count] = topCuisine;
        recommendations.push({
          type: 'success',
          title: `Focus on ${cuisineName} cuisine`,
          description: `${count} of your top ${topPerformers.length} meals are ${cuisineName} cuisine. Clients seem to prefer this style.`,
          priority: 'low',
        });
      }
    }

    return NextResponse.json({
      insights,
      statistics: overallStats,
      highlights: {
        top_performers: topPerformers,
        needs_improvement: needsImprovement,
        most_served: mostServed,
      },
      recommendations,
      pagination: {
        page,
        limit,
        total: count || 0,
        total_pages: count ? Math.ceil(count / limit) : 0,
      },
    });
  } catch (error) {
    console.error('Error fetching meal insights:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}