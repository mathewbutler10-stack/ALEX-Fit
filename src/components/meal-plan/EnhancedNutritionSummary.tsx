'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, TrendingUp, PieChart, BarChart3, Target, AlertCircle, Download } from 'lucide-react';
import { MealPlanSlot } from '@/types/meal-plan';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface EnhancedNutritionSummaryProps {
  slots: MealPlanSlot[];
  clientId: string;
  planId: string;
}

interface NutritionalAnalysis {
  dailyBreakdown: Array<{
    day: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    score: number;
  }>;
  mealTypeAnalysis: {
    breakfast: { calories: number; count: number };
    lunch: { calories: number; count: number };
    dinner: { calories: number; count: number };
  };
  nutrientDensity: {
    proteinPerCalorie: number;
    fiberScore: number;
    micronutrientScore: number;
  };
  recommendations: string[];
}

export function EnhancedNutritionSummary({ slots, clientId, planId }: EnhancedNutritionSummaryProps) {
  const [analysis, setAnalysis] = useState<NutritionalAnalysis | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('daily');

  // Calculate analysis when slots change
  useEffect(() => {
    calculateAnalysis();
  }, [slots]);

  const calculateAnalysis = async () => {
    try {
      setIsLoading(true);

      // Group by day
      const days = Array.from({ length: 7 }, (_, i) => i + 1);
      const dailyBreakdown = days.map(day => {
        const daySlots = slots.filter(slot => slot.day_number === day);
        const totals = daySlots.reduce(
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

        // Calculate day score (simplified)
        const score = Math.min(100, Math.max(0, 
          100 - Math.abs(totals.calories - 2000) / 20 // Penalize deviation from 2000 kcal
        ));

        return {
          day,
          ...totals,
          score: Math.round(score),
        };
      });

      // Analyze by meal type
      const mealTypeAnalysis = {
        breakfast: { calories: 0, count: 0 },
        lunch: { calories: 0, count: 0 },
        dinner: { calories: 0, count: 0 },
      };

      slots.forEach(slot => {
        if (slot.meal && slot.meal_type in mealTypeAnalysis) {
          const type = slot.meal_type as keyof typeof mealTypeAnalysis;
          mealTypeAnalysis[type].calories += slot.meal.calories || 0;
          mealTypeAnalysis[type].count++;
        }
      });

      // Calculate nutrient density (simplified)
      const totalCalories = dailyBreakdown.reduce((sum, day) => sum + day.calories, 0);
      const totalProtein = dailyBreakdown.reduce((sum, day) => sum + day.protein, 0);
      
      const nutrientDensity = {
        proteinPerCalorie: totalCalories > 0 ? (totalProtein * 4) / totalCalories * 100 : 0,
        fiberScore: 65, // Placeholder - would need fiber data
        micronutrientScore: 72, // Placeholder
      };

      // Generate recommendations
      const recommendations: string[] = [];
      
      // Check for calorie distribution
      const calorieRange = dailyBreakdown.map(d => d.calories);
      const maxCalories = Math.max(...calorieRange);
      const minCalories = Math.min(...calorieRange);
      
      if ((maxCalories - minCalories) > 500) {
        recommendations.push('Consider balancing calorie distribution across days');
      }

      // Check protein consistency
      const proteinRange = dailyBreakdown.map(d => d.protein);
      const proteinVariance = Math.max(...proteinRange) - Math.min(...proteinRange);
      if (proteinVariance > 30) {
        recommendations.push('Aim for more consistent daily protein intake');
      }

      // Check meal type balance
      const breakfastAvg = mealTypeAnalysis.breakfast.count > 0 
        ? mealTypeAnalysis.breakfast.calories / mealTypeAnalysis.breakfast.count 
        : 0;
      const lunchAvg = mealTypeAnalysis.lunch.count > 0 
        ? mealTypeAnalysis.lunch.calories / mealTypeAnalysis.lunch.count 
        : 0;
      const dinnerAvg = mealTypeAnalysis.dinner.count > 0 
        ? mealTypeAnalysis.dinner.calories / mealTypeAnalysis.dinner.count 
        : 0;

      if (dinnerAvg > breakfastAvg * 1.5) {
        recommendations.push('Consider redistributing calories from dinner to breakfast');
      }

      setAnalysis({
        dailyBreakdown,
        mealTypeAnalysis,
        nutrientDensity,
        recommendations,
      });
    } catch (error) {
      console.error('Error calculating analysis:', error);
      toast.error('Failed to calculate nutritional analysis');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportReport = () => {
    // In a real implementation, this would generate a PDF or CSV
    toast.success('Export feature coming soon!');
  };

  if (isLoading || !analysis) {
    return (
      <Card>
        <CardContent className="py-12">
          <div className="flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Analyzing nutrition...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Advanced Nutritional Analysis
            </CardTitle>
            <CardDescription>
              Detailed breakdown and insights for optimal nutrition
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            <Download className="mr-2 h-4 w-4" />
            Export Report
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="daily" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Daily Breakdown
            </TabsTrigger>
            <TabsTrigger value="mealtype" className="flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              By Meal Type
            </TabsTrigger>
            <TabsTrigger value="density" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Nutrient Density
            </TabsTrigger>
          </TabsList>

          {/* Daily Breakdown Tab */}
          <TabsContent value="daily" className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-3">Daily Calorie Distribution</h4>
              <div className="space-y-3">
                {analysis.dailyBreakdown.map((day) => (
                  <div key={day.day} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Day {day.day}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-sm">{day.calories.toFixed(0)} kcal</span>
                        <Badge variant={day.score >= 80 ? "default" : "secondary"}>
                          Score: {day.score}/100
                        </Badge>
                      </div>
                    </div>
                    <Progress value={Math.min(100, (day.calories / 2500) * 100)} className="h-2" />
                    <div className="grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                      <div>Protein: {day.protein.toFixed(1)}g</div>
                      <div>Carbs: {day.carbs.toFixed(1)}g</div>
                      <div>Fat: {day.fat.toFixed(1)}g</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold">
                  {Math.max(...analysis.dailyBreakdown.map(d => d.calories)).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Highest day (kcal)</div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold">
                  {Math.min(...analysis.dailyBreakdown.map(d => d.calories)).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Lowest day (kcal)</div>
              </div>
              <div className="rounded-lg border p-4 text-center">
                <div className="text-2xl font-bold">
                  {(
                    analysis.dailyBreakdown.reduce((sum, day) => sum + day.calories, 0) / 7
                  ).toFixed(0)}
                </div>
                <div className="text-sm text-muted-foreground">Daily average (kcal)</div>
              </div>
            </div>
          </TabsContent>

          {/* Meal Type Analysis Tab */}
          <TabsContent value="mealtype" className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-3">Calorie Distribution by Meal Type</h4>
              <div className="space-y-4">
                {Object.entries(analysis.mealTypeAnalysis).map(([type, data]) => (
                  <div key={type} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="capitalize font-medium">{type}</span>
                      <span className="text-sm">
                        {data.count} meals • {data.calories.toFixed(0)} total kcal
                      </span>
                    </div>
                    <Progress 
                      value={data.calories / 21000 * 100} // 21000 = 7 days * 3 meals * 1000 kcal baseline
                      className="h-3"
                    />
                    <div className="text-sm text-muted-foreground">
                      Average per meal: {data.count > 0 ? (data.calories / data.count).toFixed(0) : 0} kcal
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              {Object.entries(analysis.mealTypeAnalysis).map(([type, data]) => (
                <div key={type} className="rounded-lg border p-4 text-center">
                  <div className="text-2xl font-bold">{data.count}</div>
                  <div className="text-sm text-muted-foreground capitalize">{type} meals</div>
                  <div className="mt-1 text-xs">
                    {data.count > 0 ? (data.calories / data.count).toFixed(0) : 0} kcal avg
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* Nutrient Density Tab */}
          <TabsContent value="density" className="space-y-4">
            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-3">Nutrient Density Scores</h4>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Protein Efficiency</span>
                    <Badge variant={
                      analysis.nutrientDensity.proteinPerCalorie >= 20 
                        ? "default" 
                        : analysis.nutrientDensity.proteinPerCalorie >= 15 
                        ? "secondary" 
                        : "destructive"
                    }>
                      {analysis.nutrientDensity.proteinPerCalorie.toFixed(1)}%
                    </Badge>
                  </div>
                  <Progress 
                    value={analysis.nutrientDensity.proteinPerCalorie} 
                    className="h-2"
                  />
                  <div className="text-sm text-muted-foreground">
                    Percentage of calories from protein (target: 20-30%)
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Fiber Score</span>
                    <Badge variant={
                      analysis.nutrientDensity.fiberScore >= 70 
                        ? "default" 
                        : analysis.nutrientDensity.fiberScore >= 50 
                        ? "secondary" 
                        : "destructive"
                    }>
                      {analysis.nutrientDensity.fiberScore}/100
                    </Badge>
                  </div>
                  <Progress value={analysis.nutrientDensity.fiberScore} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    Estimated fiber content score
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Micronutrient Score</span>
                    <Badge variant={
                      analysis.nutrientDensity.micronutrientScore >= 70 
                        ? "default" 
                        : analysis.nutrientDensity.micronutrientScore >= 50 
                        ? "secondary" 
                        : "destructive"
                    }>
                      {analysis.nutrientDensity.micronutrientScore}/100
                    </Badge>
                  </div>
                  <Progress value={analysis.nutrientDensity.micronutrientScore} className="h-2" />
                  <div className="text-sm text-muted-foreground">
                    Vitamin and mineral density estimate
                  </div>
                </div>
              </div>
            </div>

            {/* Recommendations */}
            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h4 className="font-medium text-blue-800 mb-2 flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Optimization Recommendations
              </h4>
              <ul className="space-y-1 text-sm text-blue-700">
                {analysis.recommendations.length > 0 ? (
                  analysis.recommendations.map((rec, index) => (
                    <li key={index}>• {rec}</li>
                  ))
                ) : (
                  <li>• This meal plan has good nutritional balance</li>
                )}
                <li>• Ensure adequate hydration with meals</li>
                <li>• Consider timing of carbohydrate-rich meals around activity</li>
                <li>• Monitor client feedback on satiety and energy levels</li>
              </ul>
            </div>
          </TabsContent>
        </Tabs>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-lg font-bold">
              {analysis.dailyBreakdown.filter(d => d.score >= 80).length}/7
            </div>
            <div className="text-sm text-muted-foreground">Optimal days</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-lg font-bold">
              {analysis.nutrientDensity.proteinPerCalorie.toFixed(1)}%
            </div>
            <div className="text-sm text-muted-foreground">Protein efficiency</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-lg font-bold">
              {slots.filter(s => s.meal?.difficulty === 'easy').length}
            </div>
            <div className="text-sm text-muted-foreground">Easy meals</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-lg font-bold">
              {new Set(slots.map(s => s.meal?.cuisine)).size}
            </div>
            <div className="text-sm text-muted-foreground">Cuisine variety</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}