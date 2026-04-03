'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, TrendingUp, BarChart3, Filter, Download, Users, ChefHat, Clock } from 'lucide-react';
import { MealInsight } from '@/types/meal-plan';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MealInsightsDashboardProps {
  gymId: string;
  ptId?: string;
}

export function MealInsightsDashboard({ gymId, ptId }: MealInsightsDashboardProps) {
  const [insights, setInsights] = useState<MealInsight[]>([]);
  const [filteredInsights, setFilteredInsights] = useState<MealInsight[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [filters, setFilters] = useState({
    timeRange: '30days',
    mealType: 'all',
    cuisine: 'all',
    minRating: 0,
  });

  // Fetch insights
  useEffect(() => {
    fetchInsights();
  }, [gymId, ptId]);

  // Apply filters
  useEffect(() => {
    let filtered = [...insights];

    // Filter by meal type
    if (filters.mealType !== 'all') {
      filtered = filtered.filter(insight => insight.meal_type === filters.mealType);
    }

    // Filter by cuisine
    if (filters.cuisine !== 'all') {
      filtered = filtered.filter(insight => insight.cuisine === filters.cuisine);
    }

    // Filter by minimum rating
    if (filters.minRating > 0) {
      filtered = filtered.filter(insight => insight.average_rating >= filters.minRating);
    }

    setFilteredInsights(filtered);
  }, [insights, filters]);

  const fetchInsights = async () => {
    try {
      setIsLoading(true);

      // In a real implementation, this would call the API endpoint
      // For now, we'll simulate with mock data
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Mock data - in production, this would come from the API
      const mockInsights: MealInsight[] = [
        {
          meal_id: '1',
          meal_name: 'Grilled Chicken Salad',
          average_rating: 4.8,
          rating_count: 24,
          total_servings: 45,
          quick_feedback_counts: {
            loved: 18,
            too_spicy: 2,
            will_make_again: 20,
            too_complicated: 1,
          },
          common_feedback_themes: ['Healthy', 'Easy to make', 'Tasty'],
          meal_type: 'lunch',
          cuisine: 'American',
          difficulty: 'easy',
        },
        {
          meal_id: '2',
          meal_name: 'Oatmeal with Berries',
          average_rating: 4.5,
          rating_count: 32,
          total_servings: 67,
          quick_feedback_counts: {
            loved: 25,
            too_spicy: 0,
            will_make_again: 28,
            too_complicated: 0,
          },
          common_feedback_themes: ['Quick breakfast', 'Healthy', 'Filling'],
          meal_type: 'breakfast',
          cuisine: 'American',
          difficulty: 'easy',
        },
        {
          meal_id: '3',
          meal_name: 'Salmon with Vegetables',
          average_rating: 4.2,
          rating_count: 18,
          total_servings: 30,
          quick_feedback_counts: {
            loved: 12,
            too_spicy: 1,
            will_make_again: 15,
            too_complicated: 3,
          },
          common_feedback_themes: ['High protein', 'Tasty', 'Requires oven'],
          meal_type: 'dinner',
          cuisine: 'Mediterranean',
          difficulty: 'medium',
        },
        {
          meal_id: '4',
          meal_name: 'Vegetable Stir Fry',
          average_rating: 4.6,
          rating_count: 28,
          total_servings: 52,
          quick_feedback_counts: {
            loved: 22,
            too_spicy: 4,
            will_make_again: 24,
            too_complicated: 1,
          },
          common_feedback_themes: ['Vegetarian', 'Quick', 'Versatile'],
          meal_type: 'dinner',
          cuisine: 'Asian',
          difficulty: 'easy',
        },
        {
          meal_id: '5',
          meal_name: 'Greek Yogurt Parfait',
          average_rating: 4.3,
          rating_count: 20,
          total_servings: 38,
          quick_feedback_counts: {
            loved: 15,
            too_spicy: 0,
            will_make_again: 18,
            too_complicated: 0,
          },
          common_feedback_themes: ['High protein', 'Quick', 'Refreshing'],
          meal_type: 'breakfast',
          cuisine: 'Mediterranean',
          difficulty: 'easy',
        },
      ];

      setInsights(mockInsights);
      setFilteredInsights(mockInsights);
    } catch (error) {
      console.error('Error fetching insights:', error);
      toast.error('Failed to load meal insights');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportData = () => {
    // Create CSV content
    const headers = ['Meal Name', 'Average Rating', 'Rating Count', 'Total Servings', 'Meal Type', 'Cuisine', 'Difficulty'];
    const rows = filteredInsights.map(insight => [
      insight.meal_name,
      insight.average_rating.toString(),
      insight.rating_count.toString(),
      insight.total_servings.toString(),
      insight.meal_type,
      insight.cuisine,
      insight.difficulty,
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `meal-insights-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Data exported successfully!');
  };

  // Calculate statistics
  const stats = {
    totalMeals: insights.length,
    averageRating: insights.reduce((sum, i) => sum + i.average_rating, 0) / insights.length,
    totalRatings: insights.reduce((sum, i) => sum + i.rating_count, 0),
    totalServings: insights.reduce((sum, i) => sum + i.total_servings, 0),
  };

  // Get unique values for filters
  const mealTypes = Array.from(new Set(insights.map(i => i.meal_type)));
  const cuisines = Array.from(new Set(insights.map(i => i.cuisine)));

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading meal insights...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meal Performance Insights</h2>
          <p className="text-muted-foreground">
            Analyze which meals clients love and identify improvement opportunities
          </p>
        </div>
        <Button variant="outline" onClick={handleExportData}>
          <Download className="mr-2 h-4 w-4" />
          Export Data
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalMeals}</div>
                <div className="text-sm text-muted-foreground">Total Meals</div>
              </div>
              <ChefHat className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.averageRating.toFixed(1)}</div>
                <div className="text-sm text-muted-foreground">Avg Rating</div>
              </div>
              <Star className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalRatings}</div>
                <div className="text-sm text-muted-foreground">Total Ratings</div>
              </div>
              <Users className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-2xl font-bold">{stats.totalServings}</div>
                <div className="text-sm text-muted-foreground">Total Servings</div>
              </div>
              <Clock className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4" />
              <span className="text-sm font-medium">Filters:</span>
            </div>
            
            <div className="flex-1 min-w-[200px]">
              <Select
                value={filters.mealType}
                onValueChange={(value) => setFilters(prev => ({ ...prev, mealType: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Meal Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Meal Types</SelectItem>
                  {mealTypes.map(type => (
                    <SelectItem key={type} value={type} className="capitalize">
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select
                value={filters.cuisine}
                onValueChange={(value) => setFilters(prev => ({ ...prev, cuisine: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Cuisine" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cuisines</SelectItem>
                  {cuisines.map(cuisine => (
                    <SelectItem key={cuisine} value={cuisine}>
                      {cuisine}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 min-w-[200px]">
              <Select
                value={filters.minRating.toString()}
                onValueChange={(value) => setFilters(prev => ({ ...prev, minRating: parseFloat(value) }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Minimum Rating" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">Any Rating</SelectItem>
                  <SelectItem value="3">3+ Stars</SelectItem>
                  <SelectItem value="4">4+ Stars</SelectItem>
                  <SelectItem value="4.5">4.5+ Stars</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Button
              variant="outline"
              onClick={() => setFilters({
                timeRange: '30days',
                mealType: 'all',
                cuisine: 'all',
                minRating: 0,
              })}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="top" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Top Performers
          </TabsTrigger>
          <TabsTrigger value="needs" className="flex items-center gap-2">
            <Star className="h-4 w-4" />
            Needs Improvement
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>All Meals ({filteredInsights.length})</CardTitle>
              <CardDescription>
                Sorted by average rating
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInsights
                  .sort((a, b) => b.average_rating - a.average_rating)
                  .map((insight) => (
                    <div key={insight.meal_id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{insight.meal_name}</h4>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="font-medium">{insight.average_rating.toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground">
                                ({insight.rating_count} ratings)
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {insight.meal_type}
                            </Badge>
                            <Badge variant="secondary">{insight.cuisine}</Badge>
                            <Badge variant={
                              insight.difficulty === 'easy' ? 'default' :
                              insight.difficulty === 'medium' ? 'secondary' : 'destructive'
                            }>
                              {insight.difficulty}
                            </Badge>
                            <Badge variant="outline">
                              {insight.total_servings} servings
                            </Badge>
                          </div>

                          {/* Quick Feedback */}
                          <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-2">
                            {Object.entries(insight.quick_feedback_counts).map(([key, count]) => (
                              <div key={key} className="flex items-center justify-between text-sm">
                                <span className="capitalize text-muted-foreground">
                                  {key.replace('_', ' ')}:
                                </span>
                                <span className="font-medium">{count}</span>
                              </div>
                            ))}
                          </div>

                          {/* Common Themes */}
                          {insight.common_feedback_themes.length > 0 && (
                            <div className="mt-3">
                              <div className="text-sm text-muted-foreground">Common themes:</div>
                              <div className="mt-1 flex flex-wrap gap-1">
                                {insight.common_feedback_themes.map((theme, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {theme}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Top Performers Tab */}
        <TabsContent value="top" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Top Rated Meals</CardTitle>
              <CardDescription>
                Meals with the highest average ratings (4.5+ stars)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInsights
                  .filter(insight => insight.average_rating >= 4.5)
                  .sort((a, b) => b.average_rating - a.average_rating)
                  .map((insight) => (
                    <div key={insight.meal_id} className="rounded-lg border border-green-200 bg-green-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{insight.meal_name}</h4>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-yellow-500 text-yellow-500" />
                              <span className="font-medium">{insight.average_rating.toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground">
                                ({insight.rating_count} ratings)
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {insight.meal_type}
                            </Badge>
                            <Badge variant="secondary">{insight.cuisine}</Badge>
                            <Badge variant="default" className="bg-green-100 text-green-800">
                              Top Performer
                            </Badge>
                          </div>

                          <div className="mt-3 text-sm text-green-700">
                            <div className="font-medium">Why clients love it:</div>
                            <ul className="mt-1 space-y-1">
                              {insight.common_feedback_themes.slice(0, 3).map((theme, index) => (
                                <li key={index}>• {theme}</li>
                              ))}
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {filteredInsights.filter(insight => insight.average_rating >= 4.5).length === 0 && (
                  <div className="rounded-lg border p-6 text-center">
                    <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h4 className="mt-4 font-medium">No top performers found</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Try adjusting your filters or check back later for more ratings.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recommendations</CardTitle>
              <CardDescription>
                Based on top-performing meals
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                  <h5 className="font-medium text-blue-800">💡 Success Patterns</h5>
                  <ul className="mt-2 space-y-1 text-sm text-blue-700">
                    <li>• Easy-to-make meals consistently receive higher ratings</li>
                    <li>• Meals with clear dietary labels (vegetarian, gluten-free) are popular</li>
                    <li>• Quick prep time correlates with higher satisfaction</li>
                    <li>• Familiar cuisines tend to perform better than exotic ones</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Needs Improvement Tab */}
        <TabsContent value="needs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Meals Needing Improvement</CardTitle>
              <CardDescription>
                Meals with ratings below 3.5 stars or common negative feedback
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {filteredInsights
                  .filter(insight => insight.average_rating < 3.5)
                  .sort((a, b) => a.average_rating - b.average_rating)
                  .map((insight) => (
                    <div key={insight.meal_id} className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3">
                            <h4 className="font-medium">{insight.meal_name}</h4>
                            <div className="flex items-center gap-1">
                              <Star className="h-4 w-4 fill-amber-500 text-amber-500" />
                              <span className="font-medium">{insight.average_rating.toFixed(1)}</span>
                              <span className="text-sm text-muted-foreground">
                                ({insight.rating_count} ratings)
                              </span>
                            </div>
                          </div>
                          
                          <div className="mt-2 flex flex-wrap gap-2">
                            <Badge variant="outline" className="capitalize">
                              {insight.meal_type}
                            </Badge>
                            <Badge variant="secondary">{insight.cuisine}</Badge>
                            <Badge variant="destructive">Needs Improvement</Badge>
                          </div>

                          {/* Common Issues */}
                          <div className="mt-3 space-y-2">
                            <div className="text-sm font-medium text-amber-800">Common issues:</div>
                            {insight.quick_feedback_counts.too_complicated > 0 && (
                              <div className="text-sm text-amber-700">
                                • Too complicated: {insight.quick_feedback_counts.too_complicated} reports
                              </div>
                            )}
                            {insight.quick_feedback_counts.too_spicy > 0 && (
                              <div className="text-sm text-amber-700">
                                • Too spicy: {insight.quick_feedback_counts.too_spicy} reports
                              </div>
                            )}
                            {insight.average_rating < 3 && (
                              <div className="text-sm text-amber-700">
                                • Low overall satisfaction
                              </div>
                            )}
                          </div>

                          {/* Action Items */}
                          <div className="mt-4">
                            <div className="text-sm font-medium text-amber-800">Suggested actions:</div>
                            <ul className="mt-1 space-y-1 text-sm text-amber-700">
                              <li>• Consider simplifying the recipe</li>
                              <li>• Add spice level warning or adjustment options</li>
                              <li>• Review ingredient accessibility</li>
                              <li>• Consider removing from rotation if issues persist</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                
                {filteredInsights.filter(insight => insight.average_rating < 3.5).length === 0 && (
                  <div className="rounded-lg border p-6 text-center">
                    <Star className="mx-auto h-12 w-12 text-muted-foreground" />
                    <h4 className="mt-4 font-medium">All meals performing well!</h4>
                    <p className="mt-1 text-sm text-muted-foreground">
                      No meals currently need improvement based on your filters.
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}