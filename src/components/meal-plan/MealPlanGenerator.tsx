'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Users, ChefHat, Clock, Target } from 'lucide-react';
import { Client, ClientDietaryPreferences } from '@/types/meal-plan';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MealPlanGeneratorProps {
  ptId: string;
  gymId: string;
  onPlanGenerated?: (planId: string) => void;
}

export function MealPlanGenerator({ ptId, gymId, onPlanGenerated }: MealPlanGeneratorProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [preferences, setPreferences] = useState<ClientDietaryPreferences | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [clientLoading, setClientLoading] = useState(false);

  // Fetch PT's clients
  useEffect(() => {
    fetchClients();
  }, [ptId, gymId]);

  // Fetch client details and preferences when client is selected
  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetails(selectedClientId);
    } else {
      setSelectedClient(null);
      setPreferences(null);
    }
  }, [selectedClientId]);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('clients')
        .select(`
          *,
          user:users!clients_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('gym_id', gymId)
        .eq('assigned_pt_id', ptId)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setClients(data || []);
    } catch (error) {
      console.error('Error fetching clients:', error);
      toast.error('Failed to load clients');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClientDetails = async (clientId: string) => {
    try {
      setClientLoading(true);
      
      // Fetch client details
      const { data: clientData, error: clientError } = await supabase
        .from('clients')
        .select(`
          *,
          user:users!clients_user_id_fkey (
            id,
            full_name,
            email
          )
        `)
        .eq('id', clientId)
        .single();

      if (clientError) throw clientError;
      setSelectedClient(clientData);

      // Fetch dietary preferences
      const { data: preferencesData, error: preferencesError } = await supabase
        .from('client_dietary_preferences')
        .select('*')
        .eq('client_id', clientId)
        .single();

      if (preferencesError && preferencesError.code !== 'PGRST116') {
        throw preferencesError;
      }
      setPreferences(preferencesData);
    } catch (error) {
      console.error('Error fetching client details:', error);
      toast.error('Failed to load client details');
    } finally {
      setClientLoading(false);
    }
  };

  const handleGeneratePlan = async () => {
    if (!selectedClientId) {
      toast.error('Please select a client first');
      return;
    }

    if (!preferences) {
      toast.error('Client does not have dietary preferences set up');
      return;
    }

    try {
      setIsGenerating(true);
      
      const response = await fetch('/api/meal-plans/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: selectedClientId,
          preferences: preferences,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to generate meal plan');
      }

      const data = await response.json();
      
      toast.success('Meal plan generated successfully!');
      
      if (onPlanGenerated) {
        onPlanGenerated(data.plan_id);
      }
    } catch (error) {
      console.error('Error generating meal plan:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate meal plan');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <ChefHat className="h-5 w-5" />
          One-Click Meal Plan Generator
        </CardTitle>
        <CardDescription>
          Generate a personalized 7-day meal plan for your client in seconds
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Client Selection */}
        <div className="space-y-3">
          <Label htmlFor="client-select">Select Client</Label>
          <Select
            value={selectedClientId}
            onValueChange={setSelectedClientId}
            disabled={isLoading}
          >
            <SelectTrigger id="client-select">
              <SelectValue placeholder="Choose a client..." />
            </SelectTrigger>
            <SelectContent>
              {clients.map((client) => (
                <SelectItem key={client.id} value={client.id}>
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span>{client.user?.full_name || 'Unknown Client'}</span>
                  </div>
                </SelectItem>
              ))}
              {clients.length === 0 && !isLoading && (
                <SelectItem value="no-clients" disabled>
                  No clients found
                </SelectItem>
              )}
            </SelectContent>
          </Select>
          {isLoading && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Loading clients...
            </div>
          )}
        </div>

        {/* Client Details */}
        {selectedClient && (
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              {clientLoading ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="ml-2">Loading client details...</span>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm font-medium">Client Name</Label>
                      <p className="text-sm">{selectedClient.user?.full_name || 'N/A'}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm">{selectedClient.user?.email || 'N/A'}</p>
                    </div>
                  </div>

                  {/* Dietary Preferences Summary */}
                  {preferences ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4" />
                        <Label className="text-sm font-medium">Dietary Preferences</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <Label className="text-xs">Allergies</Label>
                          <p className="text-xs">
                            {preferences.allergies?.length > 0 
                              ? preferences.allergies.join(', ')
                              : 'None'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Dislikes</Label>
                          <p className="text-xs">
                            {preferences.dislikes?.length > 0 
                              ? preferences.dislikes.join(', ')
                              : 'None'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Preferences</Label>
                          <p className="text-xs">
                            {preferences.dietary_preferences?.length > 0 
                              ? preferences.dietary_preferences.join(', ')
                              : 'None'}
                          </p>
                        </div>
                        <div>
                          <Label className="text-xs">Cooking Skill</Label>
                          <p className="text-xs capitalize">{preferences.cooking_skill}</p>
                        </div>
                      </div>
                      {preferences.daily_calorie_target && (
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span className="text-sm">
                            Daily Target: {preferences.daily_calorie_target.toLocaleString()} kcal
                          </span>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                      <p className="text-sm text-amber-800">
                        ⚠️ This client doesn't have dietary preferences set up.
                        The meal plan will use default settings.
                      </p>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Generate Button */}
        <Button
          onClick={handleGeneratePlan}
          disabled={!selectedClientId || isGenerating}
          className="w-full"
          size="lg"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating Plan...
            </>
          ) : (
            'Generate 7-Day Meal Plan'
          )}
        </Button>

        {/* Info Text */}
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="text-sm text-blue-800">
            💡 The algorithm will consider:
          </p>
          <ul className="mt-2 space-y-1 text-xs text-blue-700">
            <li>• Client allergies and dislikes</li>
            <li>• Dietary preferences and cooking skill</li>
            <li>• Available time and equipment</li>
            <li>• Nutritional targets (±10% accuracy)</li>
            <li>• Meal variety (no repeats within 3 days)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}