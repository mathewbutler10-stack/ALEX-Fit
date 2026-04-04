'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Edit, Eye, Send, ShoppingCart, Download } from 'lucide-react';
import { MealPlan, MealPlanSlot } from '@/types/meal-plan';
import { MealPlanPreview } from './MealPlanPreview';
import { NutritionSummary } from './NutritionSummary';
import { EnhancedNutritionSummary } from './EnhancedNutritionSummary';
import { PublishWorkflow } from './PublishWorkflow';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MealPlanReviewProps {
  planId: string;
  onPlanPublished?: (planId: string) => void;
  onPlanEdited?: (planId: string) => void;
}

export function MealPlanReview({ planId, onPlanPublished, onPlanEdited }: MealPlanReviewProps) {
  const [plan, setPlan] = useState<MealPlan | null>(null);
  const [slots, setSlots] = useState<MealPlanSlot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('preview');
  const [isPublishing, setIsPublishing] = useState(false);
  const [showPublishWorkflow, setShowPublishWorkflow] = useState(false);

  // Fetch plan details
  useEffect(() => {
    if (planId) {
      fetchPlanDetails();
    }
  }, [planId]);

  const fetchPlanDetails = async () => {
    try {
      setIsLoading(true);

      // Fetch plan
      const { data: planData, error: planError } = await supabase
        .from('meal_plans')
        .select(`
          *,
          client:clients(
            id,
            user:users!clients_user_id_fkey(
              id,
              full_name,
              email
            )
          )
        `)
        .eq('id', planId)
        .single();

      if (planError) throw planError;
      setPlan(planData);

      // Fetch slots with meal details
      const { data: slotsData, error: slotsError } = await supabase
        .from('meal_plan_slots')
        .select(`
          *,
          meal:meal_library(*)
        `)
        .eq('meal_plan_id', planId)
        .order('day_number', { ascending: true })
        .order('order_index', { ascending: true });

      if (slotsError) throw slotsError;
      setSlots(slotsData || []);
    } catch (error) {
      console.error('Error fetching plan details:', error);
      toast.error('Failed to load meal plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSlotsUpdated = (updatedSlots: MealPlanSlot[]) => {
    setSlots(updatedSlots);
    toast.success('Meal plan updated');
    
    if (onPlanEdited) {
      onPlanEdited(planId);
    }
  };

  const handlePublish = () => {
    setShowPublishWorkflow(true);
  };

  const handlePublishComplete = (publishedPlanId: string) => {
    setShowPublishWorkflow(false);
    toast.success('Meal plan published successfully!');
    
    if (onPlanPublished) {
      onPlanPublished(publishedPlanId);
    }
    
    // Refresh plan status
    fetchPlanDetails();
  };

  const getPlanStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="outline">Draft</Badge>;
      case 'active':
        return <Badge variant="default" className="bg-green-100 text-green-800 hover:bg-green-100">Active</Badge>;
      case 'archived':
        return <Badge variant="secondary">Archived</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <span className="ml-2 text-muted-foreground">Loading meal plan...</span>
      </div>
    );
  }

  if (!plan) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="mx-auto max-w-md">
            <Eye className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">Plan Not Found</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              The meal plan you're looking for doesn't exist or you don't have access to it.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Plan Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Meal Plan Review</h2>
          <div className="mt-2 flex items-center gap-3">
            {getPlanStatusBadge(plan.status)}
            <span className="text-sm text-muted-foreground">
              Created for {plan.client?.user?.full_name || 'Unknown Client'}
            </span>
            <span className="text-sm text-muted-foreground">
              • {slots.length} meals • 7 days
            </span>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={handlePublish}
            disabled={plan.status !== 'draft' || isPublishing}
          >
            {isPublishing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Publishing...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {plan.status === 'draft' ? 'Publish Plan' : 'Update Plan'}
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="preview" className="flex items-center gap-2">
            <Eye className="h-4 w-4" />
            Plan Preview
          </TabsTrigger>
          <TabsTrigger value="nutrition" className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4" />
            Nutrition
          </TabsTrigger>
          <TabsTrigger value="advanced" className="flex items-center gap-2">
            <Edit className="h-4 w-4" />
            Advanced Analysis
          </TabsTrigger>
        </TabsList>

        {/* Plan Preview Tab */}
        <TabsContent value="preview" className="space-y-6">
          <MealPlanPreview
            planId={planId}
            slots={slots}
            onSlotsUpdated={handleSlotsUpdated}
            readOnly={plan.status !== 'draft'}
          />
          
          {plan.status === 'draft' && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium">Ready to publish?</h4>
                    <p className="text-sm text-muted-foreground">
                      Once published, this plan will be visible to your client and you can generate a grocery list.
                    </p>
                  </div>
                  <Button onClick={handlePublish}>
                    <Send className="mr-2 h-4 w-4" />
                    Publish Plan
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Nutrition Tab */}
        <TabsContent value="nutrition" className="space-y-6">
          <NutritionSummary
            slots={slots}
            dailyCalorieTarget={plan.client?.calorie_goal ?? undefined}
            proteinTarget={30}
            carbTarget={40}
            fatTarget={30}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Nutrition Notes</CardTitle>
              <CardDescription>
                Key insights about this meal plan's nutritional profile
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <h5 className="font-medium text-blue-800">💡 Pro Tips</h5>
                <ul className="mt-2 space-y-1 text-sm text-blue-700">
                  <li>• Consider client's cooking skill when assigning complex meals</li>
                  <li>• Ensure variety in protein sources throughout the week</li>
                  <li>• Balance high and low calorie days based on activity level</li>
                  <li>• Include fiber-rich meals for digestive health</li>
                </ul>
              </div>
              
              <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
                <h5 className="font-medium text-amber-800">⚠️ Review Points</h5>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  <li>• Check for any client allergies in the ingredients</li>
                  <li>• Verify cooking equipment requirements match client's kitchen</li>
                  <li>• Ensure prep times align with client's schedule</li>
                  <li>• Consider seasonal ingredient availability</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Advanced Analysis Tab */}
        <TabsContent value="advanced" className="space-y-6">
          <EnhancedNutritionSummary
            slots={slots}
            clientId={plan.client_id}
            planId={planId}
          />
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Meal Diversity Analysis</CardTitle>
              <CardDescription>
                Analysis of meal variety and repetition patterns
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold">
                      {new Set(slots.map(s => s.meal?.cuisine)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Different cuisines</div>
                  </div>
                  <div className="rounded-lg border p-4">
                    <div className="text-2xl font-bold">
                      {new Set(slots.map(s => s.meal?.difficulty)).size}
                    </div>
                    <div className="text-sm text-muted-foreground">Difficulty levels</div>
                  </div>
                </div>
                
                <div className="rounded-lg border bg-muted/50 p-4">
                  <h5 className="font-medium mb-2">Variety Score: Good</h5>
                  <p className="text-sm text-muted-foreground">
                    This plan includes a good mix of cuisines and difficulty levels, 
                    preventing meal fatigue and keeping the client engaged.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Publish Workflow Dialog */}
      {showPublishWorkflow && (
        <PublishWorkflow
          planId={planId}
          clientId={plan.client_id}
          onComplete={handlePublishComplete}
          onCancel={() => setShowPublishWorkflow(false)}
        />
      )}
    </div>
  );
}