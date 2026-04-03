'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, CheckCircle, Mail, ShoppingCart, Bell, Send, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface PublishWorkflowProps {
  planId: string;
  clientId: string;
  onComplete: (publishedPlanId: string) => void;
  onCancel: () => void;
}

type WorkflowStep = 'options' | 'grocery' | 'message' | 'confirm';

export function PublishWorkflow({ planId, clientId, onComplete, onCancel }: PublishWorkflowProps) {
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('options');
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState({
    notifyClient: true,
    generateGroceryList: true,
    sendEmail: false,
    includeNotes: true,
  });
  const [clientMessage, setClientMessage] = useState('');
  const [groceryListId, setGroceryListId] = useState<string | null>(null);

  const handleOptionChange = (key: keyof typeof options, value: boolean) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'options':
        setCurrentStep('grocery');
        break;
      case 'grocery':
        setCurrentStep('message');
        break;
      case 'message':
        setCurrentStep('confirm');
        break;
    }
  };

  const handlePreviousStep = () => {
    switch (currentStep) {
      case 'grocery':
        setCurrentStep('options');
        break;
      case 'message':
        setCurrentStep('grocery');
        break;
      case 'confirm':
        setCurrentStep('message');
        break;
    }
  };

  const handleGenerateGroceryList = async () => {
    if (!options.generateGroceryList) {
      handleNextStep();
      return;
    }

    try {
      setIsLoading(true);
      
      const response = await fetch(`/api/meal-plans/${planId}/grocery-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate grocery list');
      }

      const data = await response.json();
      setGroceryListId(data.grocery_list_id);
      toast.success('Grocery list generated successfully!');
      handleNextStep();
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate grocery list');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePublishPlan = async () => {
    try {
      setIsLoading(true);

      // Update plan status to active
      const { error: planError } = await supabase
        .from('meal_plans')
        .update({ status: 'active' })
        .eq('id', planId);

      if (planError) throw planError;

      // Create notification if enabled
      if (options.notifyClient) {
        const { error: notificationError } = await supabase
          .from('notifications')
          .insert({
            client_id: clientId,
            type: 'meal_plan_published',
            title: 'New Meal Plan Available',
            message: clientMessage || 'Your personal trainer has published a new meal plan for you!',
            metadata: {
              meal_plan_id: planId,
              grocery_list_id: groceryListId,
            },
          });

        if (notificationError) {
          console.error('Error creating notification:', notificationError);
          // Don't fail the whole publish if notification fails
        }
      }

      // Send email if enabled (in a real app, this would call an email service)
      if (options.sendEmail) {
        // This would integrate with an email service like Resend
        console.log('Email sending would be implemented here');
      }

      toast.success('Meal plan published successfully!');
      onComplete(planId);
    } catch (error) {
      console.error('Error publishing meal plan:', error);
      toast.error('Failed to publish meal plan');
    } finally {
      setIsLoading(false);
    }
  };

  const getStepProgress = () => {
    const steps: WorkflowStep[] = ['options', 'grocery', 'message', 'confirm'];
    const currentIndex = steps.indexOf(currentStep);
    return ((currentIndex + 1) / steps.length) * 100;
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'options':
        return (
          <div className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Bell className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="notify-client" className="font-medium">
                      Notify Client
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Send in-app notification to client
                    </p>
                  </div>
                </div>
                <Switch
                  id="notify-client"
                  checked={options.notifyClient}
                  onCheckedChange={(checked) => handleOptionChange('notifyClient', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingCart className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="generate-grocery" className="font-medium">
                      Generate Grocery List
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Create shopping list from meal ingredients
                    </p>
                  </div>
                </div>
                <Switch
                  id="generate-grocery"
                  checked={options.generateGroceryList}
                  onCheckedChange={(checked) => handleOptionChange('generateGroceryList', checked)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="send-email" className="font-medium">
                      Send Email Notification
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Optional email to client (requires setup)
                    </p>
                  </div>
                </div>
                <Switch
                  id="send-email"
                  checked={options.sendEmail}
                  onCheckedChange={(checked) => handleOptionChange('sendEmail', checked)}
                  disabled // Disabled until email is configured
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <Label htmlFor="include-notes" className="font-medium">
                      Include Preparation Notes
                    </Label>
                    <p className="text-sm text-muted-foreground">
                      Add tips and notes for the client
                    </p>
                  </div>
                </div>
                <Switch
                  id="include-notes"
                  checked={options.includeNotes}
                  onCheckedChange={(checked) => handleOptionChange('includeNotes', checked)}
                />
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h4 className="font-medium text-blue-800">💡 Recommendation</h4>
              <p className="mt-1 text-sm text-blue-700">
                We recommend generating a grocery list and notifying the client. 
                This provides the best experience and ensures they have everything they need.
              </p>
            </div>
          </div>
        );

      case 'grocery':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-4 text-lg font-medium">Generate Grocery List</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                This will analyze all ingredients from the 7-day meal plan and create 
                an organized shopping list for your client.
              </p>
              
              <div className="mt-6 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span>Ingredients analyzed</span>
                  <Badge>21 items</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Categorized by type</span>
                  <Badge variant="outline">5 categories</Badge>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span>Estimated cost</span>
                  <Badge variant="secondary">$85-120</Badge>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
              <h4 className="font-medium text-amber-800">⚠️ Note</h4>
              <p className="mt-1 text-sm text-amber-700">
                Grocery lists are generated based on standard ingredient measurements. 
                Clients may need to adjust quantities based on household size and preferences.
              </p>
            </div>
          </div>
        );

      case 'message':
        return (
          <div className="space-y-6">
            <div>
              <Label htmlFor="client-message" className="font-medium">
                Personal Message to Client
              </Label>
              <p className="mt-1 text-sm text-muted-foreground">
                Add a personal note to accompany the meal plan notification
              </p>
              <Textarea
                id="client-message"
                value={clientMessage}
                onChange={(e) => setClientMessage(e.target.value)}
                placeholder="Hi [Client Name], I've created a personalized 7-day meal plan for you! This plan considers your dietary preferences and goals. Let me know if you have any questions!"
                className="mt-3 min-h-[120px]"
              />
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <h4 className="font-medium mb-2">Message Preview</h4>
              <div className="rounded bg-background p-3 text-sm">
                <div className="font-medium">New Meal Plan Available</div>
                <div className="mt-1 text-muted-foreground">
                  {clientMessage || 'Your personal trainer has published a new meal plan for you!'}
                </div>
                {options.includeNotes && (
                  <div className="mt-2 pt-2 border-t">
                    <div className="font-medium">Preparation Tips:</div>
                    <ul className="mt-1 space-y-1 text-muted-foreground">
                      <li>• Review the grocery list before shopping</li>
                      <li>• Prep ingredients in advance to save time</li>
                      <li>• Adjust portion sizes based on your hunger levels</li>
                      <li>• Don't hesitate to swap meals if needed</li>
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-lg border border-green-100 bg-green-50 p-4">
              <h4 className="font-medium text-green-800">✅ Ready to Publish</h4>
              <p className="mt-1 text-sm text-green-700">
                Your meal plan is complete! Once published, your client will be able to:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-green-700">
                <li>• View their 7-day meal plan</li>
                <li>• Access the grocery list (if generated)</li>
                <li>• Rate meals and provide feedback</li>
                <li>• Track their nutrition progress</li>
              </ul>
            </div>
          </div>
        );

      case 'confirm':
        return (
          <div className="space-y-6">
            <div className="rounded-lg border bg-muted/50 p-6 text-center">
              <CheckCircle className="mx-auto h-12 w-12 text-green-600" />
              <h3 className="mt-4 text-lg font-medium">Ready to Publish!</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                Review your selections before publishing the meal plan to your client.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm">Plan Status</span>
                <Badge variant="outline">Draft → Active</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Client Notification</span>
                <Badge variant={options.notifyClient ? "default" : "secondary"}>
                  {options.notifyClient ? 'Enabled' : 'Disabled'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Grocery List</span>
                <Badge variant={options.generateGroceryList ? "default" : "secondary"}>
                  {options.generateGroceryList ? 'Generated' : 'Not generated'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">Personal Message</span>
                <Badge variant={clientMessage ? "default" : "secondary"}>
                  {clientMessage ? 'Included' : 'Not included'}
                </Badge>
              </div>
            </div>

            <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
              <h4 className="font-medium text-blue-800">📋 What happens next?</h4>
              <ul className="mt-2 space-y-1 text-sm text-blue-700">
                <li>• Meal plan becomes visible to client</li>
                <li>• Client receives notification (if enabled)</li>
                <li>• Grocery list becomes available (if generated)</li>
                <li>• You can track client engagement and feedback</li>
                <li>• Plan can be modified or archived later</li>
              </ul>
            </div>
          </div>
        );
    }
  };

  const getStepTitle = () => {
    switch (currentStep) {
      case 'options': return 'Publish Options';
      case 'grocery': return 'Grocery List';
      case 'message': return 'Client Message';
      case 'confirm': return 'Confirmation';
    }
  };

  const getStepDescription = () => {
    switch (currentStep) {
      case 'options': return 'Choose how you want to publish this meal plan';
      case 'grocery': return 'Generate a shopping list for your client';
      case 'message': return 'Add a personal note for your client';
      case 'confirm': return 'Review and confirm your selections';
    }
  };

  const isNextDisabled = () => {
    if (currentStep === 'grocery' && options.generateGroceryList && isLoading) {
      return true;
    }
    return false;
  };

  const getNextButtonText = () => {
    if (currentStep === 'grocery' && options.generateGroceryList) {
      return isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : (
        'Generate & Continue'
      );
    }
    
    if (currentStep === 'confirm') {
      return isLoading ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Publishing...
        </>
      ) : (
        <>
          <Send className="mr-2 h-4 w-4" />
          Publish Plan
        </>
      );
    }
    
    return (
      <>
        Continue
        <ArrowRight className="ml-2 h-4 w-4" />
      </>
    );
  };

  const handleNextClick = () => {
    if (currentStep === 'grocery') {
      handleGenerateGroceryList();
    } else if (currentStep === 'confirm') {
      handlePublishPlan();
    } else {
      handleNextStep();
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{getStepTitle()}</DialogTitle>
          <DialogDescription>{getStepDescription()}</DialogDescription>
        </DialogHeader>

        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="font-medium">Step {['options', 'grocery', 'message', 'confirm'].indexOf(currentStep) + 1} of 4</span>
            <span>{Math.round(getStepProgress())}%</span>
          </div>
          <div className="h-2 rounded-full bg-muted overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-300"
              style={{ width: `${getStepProgress()}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="flex-1 overflow-auto py-4">
          {renderStepContent()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={currentStep === 'options' ? onCancel : handlePreviousStep}
            disabled={isLoading}
          >
            {currentStep === 'options' ? 'Cancel' : 'Back'}
          </Button>
          <Button
            onClick={handleNextClick}
            disabled={isNextDisabled()}
          >
            {getNextButtonText()}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
