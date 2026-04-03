'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, Calendar, Utensils, Clock, ChefHat, SwapHorizontal } from 'lucide-react';
import { MealPlanSlot } from '@/types/meal-plan';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';
import { MealSwapDialog } from './MealSwapDialog';

interface MealPlanPreviewProps {
  planId: string;
  slots: MealPlanSlot[];
  onSlotsUpdated?: (updatedSlots: MealPlanSlot[]) => void;
  readOnly?: boolean;
}

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEAL_TYPES = ['breakfast', 'lunch', 'dinner'] as const;

export function MealPlanPreview({ planId, slots, onSlotsUpdated, readOnly = false }: MealPlanPreviewProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [swapDialogOpen, setSwapDialogOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<MealPlanSlot | null>(null);

  // Group slots by day
  const slotsByDay = Array.from({ length: 7 }, (_, dayIndex) => {
    const daySlots = slots.filter(slot => slot.day_number === dayIndex + 1);
    return {
      dayNumber: dayIndex + 1,
      dayName: DAYS[dayIndex],
      breakfast: daySlots.find(slot => slot.meal_type === 'breakfast'),
      lunch: daySlots.find(slot => slot.meal_type === 'lunch'),
      dinner: daySlots.find(slot => slot.meal_type === 'dinner'),
    };
  });

  const handleMealClick = (slot: MealPlanSlot) => {
    if (readOnly) return;
    setSelectedSlot(slot);
    setSwapDialogOpen(true);
  };

  const handleMealSwap = async (newMealId: string) => {
    if (!selectedSlot) return;

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/meal-plans/${planId}/swap`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          slot_id: selectedSlot.id,
          new_meal_id: newMealId,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to swap meal');
      }

      const updatedSlot = await response.json();
      
      // Update local state
      const updatedSlots = slots.map(slot => 
        slot.id === selectedSlot.id ? updatedSlot : slot
      );
      
      if (onSlotsUpdated) {
        onSlotsUpdated(updatedSlots);
      }
      
      toast.success('Meal swapped successfully!');
      setSwapDialogOpen(false);
    } catch (error) {
      console.error('Error swapping meal:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to swap meal');
    } finally {
      setIsLoading(false);
    }
  };

  const getDifficultyColor = (difficulty: string | null) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType) {
      case 'breakfast': return '🥞';
      case 'lunch': return '🥗';
      case 'dinner': return '🍽️';
      default: return '🍴';
    }
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                7-Day Meal Plan Preview
              </CardTitle>
              <CardDescription>
                {slots.length} meals across 7 days • Click any meal to swap
              </CardDescription>
            </div>
            {!readOnly && (
              <Badge variant="outline" className="flex items-center gap-1">
                <SwapHorizontal className="h-3 w-3" />
                Editable
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Updating plan...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="p-3 text-left font-medium">Day</th>
                    <th className="p-3 text-left font-medium">Breakfast</th>
                    <th className="p-3 text-left font-medium">Lunch</th>
                    <th className="p-3 text-left font-medium">Dinner</th>
                  </tr>
                </thead>
                <tbody>
                  {slotsByDay.map((day) => (
                    <tr key={day.dayNumber} className="border-b hover:bg-muted/50">
                      <td className="p-3">
                        <div className="font-medium">{day.dayName}</div>
                        <div className="text-sm text-muted-foreground">Day {day.dayNumber}</div>
                      </td>
                      {MEAL_TYPES.map((mealType) => {
                        const slot = day[mealType];
                        return (
                          <td key={mealType} className="p-3">
                            {slot?.meal ? (
                              <div
                                className={`rounded-lg border p-3 transition-all hover:shadow-sm ${
                                  !readOnly ? 'cursor-pointer hover:border-primary' : ''
                                }`}
                                onClick={() => !readOnly && handleMealClick(slot)}
                              >
                                <div className="flex items-start justify-between">
                                  <div className="flex-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-lg">{getMealTypeIcon(mealType)}</span>
                                      <h4 className="font-medium">{slot.meal.name}</h4>
                                    </div>
                                    <div className="mt-2 flex flex-wrap gap-1">
                                      <Badge 
                                        variant="secondary" 
                                        className={getDifficultyColor(slot.meal.difficulty)}
                                      >
                                        <ChefHat className="mr-1 h-3 w-3" />
                                        {slot.meal.difficulty || 'Unknown'}
                                      </Badge>
                                      {slot.meal.prep_time_minutes && (
                                        <Badge variant="outline" className="flex items-center gap-1">
                                          <Clock className="h-3 w-3" />
                                          {slot.meal.prep_time_minutes} min
                                        </Badge>
                                      )}
                                      {slot.meal.calories && (
                                        <Badge variant="outline">
                                          {slot.meal.calories} kcal
                                        </Badge>
                                      )}
                                    </div>
                                    {slot.meal.dietary_flags && slot.meal.dietary_flags.length > 0 && (
                                      <div className="mt-2">
                                        <div className="flex flex-wrap gap-1">
                                          {slot.meal.dietary_flags.map((flag) => (
                                            <Badge key={flag} variant="secondary" className="text-xs">
                                              {flag}
                                            </Badge>
                                          ))}
                                        </div>
                                      </div>
                                    )}
                                    {slot.meal.average_rating && (
                                      <div className="mt-2 flex items-center gap-1">
                                        <div className="flex">
                                          {[...Array(5)].map((_, i) => (
                                            <span
                                              key={i}
                                              className={`text-sm ${
                                                i < Math.floor(slot.meal.average_rating!)
                                                  ? 'text-yellow-500'
                                                  : 'text-gray-300'
                                              }`}
                                            >
                                              ★
                                            </span>
                                          ))}
                                        </div>
                                        <span className="text-xs text-muted-foreground">
                                          ({slot.meal.rating_count || 0})
                                        </span>
                                      </div>
                                    )}
                                  </div>
                                  {!readOnly && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="ml-2"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleMealClick(slot);
                                      }}
                                    >
                                      <SwapHorizontal className="h-4 w-4" />
                                    </Button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <div className="rounded-lg border border-dashed p-3 text-center text-muted-foreground">
                                <Utensils className="mx-auto h-6 w-6" />
                                <p className="mt-1 text-sm">No {mealType} assigned</p>
                              </div>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Legend */}
          <div className="mt-6 rounded-lg border bg-muted/50 p-4">
            <h4 className="mb-2 font-medium">Legend</h4>
            <div className="flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <Badge className="bg-green-100 text-green-800">
                  <ChefHat className="mr-1 h-3 w-3" />
                  Easy
                </Badge>
                <span className="text-sm text-muted-foreground">Beginner-friendly</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-yellow-100 text-yellow-800">
                  <ChefHat className="mr-1 h-3 w-3" />
                  Medium
                </Badge>
                <span className="text-sm text-muted-foreground">Intermediate</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge className="bg-red-100 text-red-800">
                  <ChefHat className="mr-1 h-3 w-3" />
                  Hard
                </Badge>
                <span className="text-sm text-muted-foreground">Advanced</span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  15 min
                </Badge>
                <span className="text-sm text-muted-foreground">Prep time</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Swap Dialog */}
      {selectedSlot && (
        <MealSwapDialog
          open={swapDialogOpen}
          onOpenChange={setSwapDialogOpen}
          slot={selectedSlot}
          onSwap={handleMealSwap}
          isLoading={isLoading}
        />
      )}
    </>
  );
}