'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Target, CheckCircle, AlertCircle, TrendingUp, PieChart } from 'lucide-react';
import { MealPlanSlot } from '@/types/meal-plan';

interface NutritionSummaryProps {
  slots: MealPlanSlot[];
  dailyCalorieTarget?: number;
  proteinTarget?: number;
  carbTarget?: number;
  fatTarget?: number;
}

export function NutritionSummary({ 
  slots, 
  dailyCalorieTarget,
  proteinTarget = 30,
  carbTarget = 40,
  fatTarget = 30
}: NutritionSummaryProps) {
  // Calculate totals
  const totals = slots.reduce(
    (acc, slot) => {
      if (slot.meal) {
        acc.calories += slot.meal.calories || 0;
        acc.protein += slot.meal.protein || 0;
        acc.carbs += slot.meal.carbs || 0;
        acc.fat += slot.meal.fat || 0;
      }
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  // Calculate daily averages (7 days)
  const dailyAverages = {
    calories: totals.calories / 7,
    protein: totals.protein / 7,
    carbs: totals.carbs / 7,
    fat: totals.fat / 7,
  };

  // Calculate macronutrient percentages
  const proteinCalories = dailyAverages.protein * 4;
  const carbCalories = dailyAverages.carbs * 4;
  const fatCalories = dailyAverages.fat * 9;
  const totalDailyCalories = proteinCalories + carbCalories + fatCalories;

  const macronutrientPercentages = {
    protein: totalDailyCalories > 0 ? (proteinCalories / totalDailyCalories) * 100 : 0,
    carbs: totalDailyCalories > 0 ? (carbCalories / totalDailyCalories) * 100 : 0,
    fat: totalDailyCalories > 0 ? (fatCalories / totalDailyCalories) * 100 : 0,
  };

  // Check if targets are met
  const calorieDeviation = dailyCalorieTarget 
    ? Math.abs((dailyAverages.calories - dailyCalorieTarget) / dailyCalorieTarget) * 100
    : 0;

  const meetsCalorieTarget = dailyCalorieTarget 
    ? calorieDeviation <= 10 // Within 10%
    : true;

  const meetsMacroTargets = 
    Math.abs(macronutrientPercentages.protein - proteinTarget) <= 5 &&
    Math.abs(macronutrientPercentages.carbs - carbTarget) <= 5 &&
    Math.abs(macronutrientPercentages.fat - fatTarget) <= 5;

  // Get calorie status
  const getCalorieStatus = () => {
    if (!dailyCalorieTarget) return { color: 'text-gray-600', icon: <Target className="h-4 w-4" /> };
    
    if (calorieDeviation <= 5) {
      return { 
        color: 'text-green-600', 
        icon: <CheckCircle className="h-4 w-4" />,
        label: 'Perfect match'
      };
    } else if (calorieDeviation <= 10) {
      return { 
        color: 'text-amber-600', 
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Within target'
      };
    } else {
      return { 
        color: 'text-red-600', 
        icon: <AlertCircle className="h-4 w-4" />,
        label: 'Needs adjustment'
      };
    }
  };

  const calorieStatus = getCalorieStatus();

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-5 w-5" />
          Nutritional Analysis
        </CardTitle>
        <CardDescription>
          7-day averages based on {slots.length} meals
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Calorie Summary */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <h4 className="font-medium">Daily Calories</h4>
            </div>
            <Badge variant={meetsCalorieTarget ? "default" : "destructive"}>
              {calorieStatus.icon}
              <span className="ml-1">{calorieStatus.label}</span>
            </Badge>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold">{Math.round(dailyAverages.calories)}</div>
              <div className="text-sm text-muted-foreground">Average per day</div>
            </div>
            {dailyCalorieTarget && (
              <div>
                <div className="text-2xl font-bold">{dailyCalorieTarget.toLocaleString()}</div>
                <div className="text-sm text-muted-foreground">Target</div>
              </div>
            )}
          </div>

          {dailyCalorieTarget && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Deviation: {calorieDeviation.toFixed(1)}%</span>
                <span className={calorieStatus.color}>
                  {dailyAverages.calories > dailyCalorieTarget ? 'Over' : 'Under'} target
                </span>
              </div>
              <Progress 
                value={Math.min(100, (dailyAverages.calories / dailyCalorieTarget) * 100)} 
                className="h-2"
              />
            </div>
          )}
        </div>

        {/* Macronutrient Breakdown */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              <h4 className="font-medium">Macronutrient Balance</h4>
            </div>
            <Badge variant={meetsMacroTargets ? "default" : "secondary"}>
              {meetsMacroTargets ? 'Balanced' : 'Needs adjustment'}
            </Badge>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {/* Protein */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Protein</span>
                <span className="text-sm font-bold">{macronutrientPercentages.protein.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={macronutrientPercentages.protein} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground">{proteinTarget}%</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {dailyAverages.protein.toFixed(1)}g per day
              </div>
            </div>

            {/* Carbs */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Carbs</span>
                <span className="text-sm font-bold">{macronutrientPercentages.carbs.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={macronutrientPercentages.carbs} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground">{carbTarget}%</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {dailyAverages.carbs.toFixed(1)}g per day
              </div>
            </div>

            {/* Fat */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium">Fat</span>
                <span className="text-sm font-bold">{macronutrientPercentages.fat.toFixed(1)}%</span>
              </div>
              <div className="flex items-center gap-2">
                <Progress 
                  value={macronutrientPercentages.fat} 
                  className="h-2 flex-1"
                />
                <span className="text-xs text-muted-foreground">{fatTarget}%</span>
              </div>
              <div className="text-sm text-muted-foreground">
                {dailyAverages.fat.toFixed(1)}g per day
              </div>
            </div>
          </div>

          {/* Macronutrient Targets */}
          <div className="rounded-lg border bg-muted/50 p-3">
            <h5 className="text-sm font-medium mb-2">Target Ratios</h5>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-lg font-bold">{proteinTarget}%</div>
                <div className="text-xs text-muted-foreground">Protein</div>
              </div>
              <div>
                <div className="text-lg font-bold">{carbTarget}%</div>
                <div className="text-xs text-muted-foreground">Carbs</div>
              </div>
              <div>
                <div className="text-lg font-bold">{fatTarget}%</div>
                <div className="text-xs text-muted-foreground">Fat</div>
              </div>
            </div>
          </div>
        </div>

        {/* Weekly Totals */}
        <div className="space-y-3">
          <h4 className="font-medium">Weekly Totals</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{Math.round(totals.calories)}</div>
              <div className="text-sm text-muted-foreground">Calories</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{totals.protein.toFixed(0)}g</div>
              <div className="text-sm text-muted-foreground">Protein</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{totals.carbs.toFixed(0)}g</div>
              <div className="text-sm text-muted-foreground">Carbs</div>
            </div>
            <div className="rounded-lg border p-3 text-center">
              <div className="text-2xl font-bold">{totals.fat.toFixed(0)}g</div>
              <div className="text-sm text-muted-foreground">Fat</div>
            </div>
          </div>
        </div>

        {/* Summary Status */}
        <div className={`rounded-lg border p-4 ${
          meetsCalorieTarget && meetsMacroTargets
            ? 'border-green-200 bg-green-50'
            : 'border-amber-200 bg-amber-50'
        }`}>
          <div className="flex items-start gap-3">
            {meetsCalorieTarget && meetsMacroTargets ? (
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
            )}
            <div>
              <h5 className="font-medium">
                {meetsCalorieTarget && meetsMacroTargets
                  ? 'Nutritional targets met!'
                  : 'Nutritional review recommended'}
              </h5>
              <p className="text-sm mt-1">
                {meetsCalorieTarget && meetsMacroTargets
                  ? 'This meal plan meets all nutritional targets and is ready for your client.'
                  : 'This meal plan may need adjustments to better match nutritional targets.'}
              </p>
              {!meetsCalorieTarget && dailyCalorieTarget && (
                <p className="text-sm mt-1">
                  • Calorie deviation: {calorieDeviation.toFixed(1)}% (target: ≤10%)
                </p>
              )}
              {!meetsMacroTargets && (
                <p className="text-sm mt-1">
                  • Macronutrient ratios differ from targets by more than 5%
                </p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}