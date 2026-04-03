'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Search, ChefHat, Clock, Star, Filter } from 'lucide-react';
import { MealPlanSlot } from '@/types/meal-plan';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MealSwapDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  slot: MealPlanSlot;
  onSwap: (newMealId: string) => Promise<void>;
  isLoading: boolean;
}

interface Meal {
  id: string;
  name: string;
  meal_type: string;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  prep_time_minutes: number | null;
  difficulty: 'easy' | 'medium' | 'hard' | null;
  dietary_flags: string[] | null;
  cuisine: string | null;
  average_rating: number | null;
  rating_count: number | null;
}

export function MealSwapDialog({
  open,
  onOpenChange,
  slot,
  onSwap,
  isLoading,
}: MealSwapDialogProps) {
  const [meals, setMeals] = useState<Meal[]>([]);
  const [filteredMeals, setFilteredMeals] = useState<Meal[]>([]);
  const [selectedMealId, setSelectedMealId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoadingMeals, setIsLoadingMeals] = useState(false);
  const [filters, setFilters] = useState({
    difficulty: '',
    cuisine: '',
    dietaryFlag: '',
  });

  // Fetch alternative meals when dialog opens
  useEffect(() => {
    if (open) {
      fetchAlternativeMeals();
    } else {
      // Reset state when dialog closes
      setMeals([]);
      setFilteredMeals([]);
      setSelectedMealId('');
      setSearchQuery('');
      setFilters({ difficulty: '', cuisine: '', dietaryFlag: '' });
    }
  }, [open, slot]);

  // Apply filters and search
  useEffect(() => {
    let result = meals;

    // Apply search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(meal => 
        meal.name.toLowerCase().includes(query) ||
        meal.cuisine?.toLowerCase().includes(query) ||
        meal.dietary_flags?.some(flag => flag.toLowerCase().includes(query))
      );
    }

    // Apply filters
    if (filters.difficulty) {
      result = result.filter(meal => meal.difficulty === filters.difficulty);
    }
    if (filters.cuisine) {
      result = result.filter(meal => meal.cuisine === filters.cuisine);
    }
    if (filters.dietaryFlag) {
      result = result.filter(meal => 
        meal.dietary_flags?.includes(filters.dietaryFlag)
      );
    }

    setFilteredMeals(result);
  }, [meals, searchQuery, filters]);

  const fetchAlternativeMeals = async () => {
    try {
      setIsLoadingMeals(true);
      
      // Fetch meals of the same type from the same gym
      const { data, error } = await supabase
        .from('meal_library')
        .select('*')
        .eq('meal_type', slot.meal?.meal_type || '')
        .eq('gym_id', slot.meal?.gym_id || '')
        .neq('id', slot.meal_id) // Exclude current meal
        .order('average_rating', { ascending: false })
        .limit(20);

      if (error) throw error;
      setMeals(data || []);
      setFilteredMeals(data || []);
    } catch (error) {
      console.error('Error fetching alternative meals:', error);
      toast.error('Failed to load alternative meals');
    } finally {
      setIsLoadingMeals(false);
    }
  };

  const handleSwap = async () => {
    if (!selectedMealId) {
      toast.error('Please select a meal to swap with');
      return;
    }

    await onSwap(selectedMealId);
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique values for filters
  const difficulties = Array.from(new Set(meals.map(m => m.difficulty).filter(Boolean)));
  const cuisines = Array.from(new Set(meals.map(m => m.cuisine).filter(Boolean)));
  const dietaryFlags = Array.from(
    new Set(meals.flatMap(m => m.dietary_flags || []).filter(Boolean))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Swap Meal</DialogTitle>
          <DialogDescription>
            Replace "{slot.meal?.name}" with an alternative {slot.meal_type} meal
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex flex-col gap-4">
          {/* Current Meal */}
          <div className="rounded-lg border bg-muted/50 p-4">
            <h4 className="font-medium mb-2">Current Meal</h4>
            <div className="flex items-center justify-between">
              <div>
                <h5 className="font-medium">{slot.meal?.name}</h5>
                <div className="mt-1 flex flex-wrap gap-1">
                  {slot.meal?.difficulty && (
                    <Badge className={getDifficultyColor(slot.meal.difficulty)}>
                      <ChefHat className="mr-1 h-3 w-3" />
                      {slot.meal.difficulty}
                    </Badge>
                  )}
                  {slot.meal?.prep_time_minutes && (
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {slot.meal.prep_time_minutes} min
                    </Badge>
                  )}
                  {slot.meal?.calories && (
                    <Badge variant="outline">
                      {slot.meal.calories} kcal
                    </Badge>
                  )}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Current Rating</div>
                {slot.meal?.average_rating ? (
                  <div className="flex items-center gap-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <span
                          key={i}
                          className={`text-sm ${
                            i < Math.floor(slot.meal!.average_rating!)
                              ? 'text-yellow-500'
                              : 'text-gray-300'
                          }`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm">
                      ({slot.meal.rating_count || 0})
                    </span>
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">No ratings</span>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search meals by name, cuisine, or dietary flag..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Button variant="outline" size="icon">
                <Filter className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="difficulty-filter" className="text-xs">Difficulty:</Label>
                <select
                  id="difficulty-filter"
                  value={filters.difficulty}
                  onChange={(e) => setFilters(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">All</option>
                  {difficulties.map(diff => (
                    <option key={diff} value={diff}>{diff}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="cuisine-filter" className="text-xs">Cuisine:</Label>
                <select
                  id="cuisine-filter"
                  value={filters.cuisine}
                  onChange={(e) => setFilters(prev => ({ ...prev, cuisine: e.target.value }))}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">All</option>
                  {cuisines.map(cuisine => (
                    <option key={cuisine} value={cuisine}>{cuisine}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="dietary-filter" className="text-xs">Dietary:</Label>
                <select
                  id="dietary-filter"
                  value={filters.dietaryFlag}
                  onChange={(e) => setFilters(prev => ({ ...prev, dietaryFlag: e.target.value }))}
                  className="rounded-md border border-input bg-background px-2 py-1 text-xs"
                >
                  <option value="">All</option>
                  {dietaryFlags.map(flag => (
                    <option key={flag} value={flag}>{flag}</option>
                  ))}
                </select>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters({ difficulty: '', cuisine: '', dietaryFlag: '' })}
                className="ml-auto"
              >
                Clear Filters
              </Button>
            </div>
          </div>

          {/* Alternative Meals */}
          <div className="flex-1 overflow-auto rounded-lg border">
            {isLoadingMeals ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                <span className="ml-2 text-muted-foreground">Loading meals...</span>
              </div>
            ) : filteredMeals.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="h-12 w-12 text-muted-foreground" />
                <h4 className="mt-4 font-medium">No meals found</h4>
                <p className="mt-1 text-sm text-muted-foreground">
                  Try adjusting your search or filters
                </p>
              </div>
            ) : (
              <div className="divide-y">
                {filteredMeals.map((meal) => (
                  <div
                    key={meal.id}
                    className={`p-4 hover:bg-muted/50 cursor-pointer transition-colors ${
                      selectedMealId === meal.id ? 'bg-primary/10 border-l-4 border-l-primary' : ''
                    }`}
                    onClick={() => setSelectedMealId(meal.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{meal.name}</h5>
                          {meal.average_rating && (
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-yellow-500 text-yellow-500" />
                              <span className="text-sm font-medium">
                                {meal.average_rating.toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({meal.rating_count})
                              </span>
                            </div>
                          )}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {meal.difficulty && (
                            <Badge className={getDifficultyColor(meal.difficulty)}>
                              <ChefHat className="mr-1 h-3 w-3" />
                              {meal.difficulty}
                            </Badge>
                          )}
                          {meal.prep_time_minutes && (
                            <Badge variant="outline" className="flex items-center gap-1">
                              <Clock className="h-3 w-3" />
                              {meal.prep_time_minutes} min
                            </Badge>
                          )}
                          {meal.calories && (
                            <Badge variant="outline">
                              {meal.calories} kcal
                            </Badge>
                          )}
                          {meal.cuisine && (
                            <Badge variant="secondary">{meal.cuisine}</Badge>
                          )}
                        </div>
                        {meal.dietary_flags && meal.dietary_flags.length > 0 && (
                          <div className="mt-2">
                            <div className="flex flex-wrap gap-1">
                              {meal.dietary_flags.map((flag) => (
                                <Badge key={flag} variant="outline" className="text-xs">
                                  {flag}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="ml-4">
                        <div className={`h-3 w-3 rounded-full border ${
                          selectedMealId === meal.id 
                            ? 'bg-primary border-primary' 
                            : 'border-muted-foreground'
                        }`} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              {filteredMeals.length} of {meals.length} meals shown
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleSwap}
                disabled={!selectedMealId || isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Swapping...
                  </>
                ) : (
                  'Swap Meal'
                )}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}