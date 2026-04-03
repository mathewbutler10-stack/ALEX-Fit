'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2, ShoppingCart, CheckCircle, Package, DollarSign, Download, Printer } from 'lucide-react';
import { GroceryList, GroceryListItem } from '@/types/meal-plan';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface GroceryListGeneratorProps {
  planId: string;
  clientId: string;
  onListGenerated?: (listId: string) => void;
}

export function GroceryListGenerator({ planId, clientId, onListGenerated }: GroceryListGeneratorProps) {
  const [groceryList, setGroceryList] = useState<GroceryList | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [purchasedItems, setPurchasedItems] = useState<Set<string>>(new Set());

  // Check for existing grocery list
  useEffect(() => {
    checkExistingList();
  }, [planId]);

  const checkExistingList = async () => {
    try {
      const { data, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          items:grocery_list_items(*)
        `)
        .eq('meal_plan_id', planId)
        .eq('client_id', clientId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setGroceryList(data);
        // Initialize purchased items set
        const purchased = new Set(
          data.items
            .filter((item: GroceryListItem) => item.purchased)
            .map((item: GroceryListItem) => item.id)
        );
        setPurchasedItems(purchased);
      }
    } catch (error) {
      console.error('Error checking for existing list:', error);
    }
  };

  const handleGenerateList = async () => {
    try {
      setIsGenerating(true);
      
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
      
      // Fetch the generated list
      const { data: listData, error } = await supabase
        .from('grocery_lists')
        .select(`
          *,
          items:grocery_list_items(*)
        `)
        .eq('id', data.grocery_list_id)
        .single();

      if (error) throw error;

      setGroceryList(listData);
      setPurchasedItems(new Set());
      
      toast.success('Grocery list generated successfully!');
      
      if (onListGenerated) {
        onListGenerated(data.grocery_list_id);
      }
    } catch (error) {
      console.error('Error generating grocery list:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to generate grocery list');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleTogglePurchased = async (itemId: string, purchased: boolean) => {
    try {
      const { error } = await supabase
        .from('grocery_list_items')
        .update({ purchased })
        .eq('id', itemId);

      if (error) throw error;

      // Update local state
      const newPurchased = new Set(purchasedItems);
      if (purchased) {
        newPurchased.add(itemId);
      } else {
        newPurchased.delete(itemId);
      }
      setPurchasedItems(newPurchased);

      // Update grocery list items
      if (groceryList) {
        const updatedItems = groceryList.items.map(item => 
          item.id === itemId ? { ...item, purchased } : item
        );
        setGroceryList({ ...groceryList, items: updatedItems });
      }
    } catch (error) {
      console.error('Error updating item:', error);
      toast.error('Failed to update item');
    }
  };

  const handleMarkAllPurchased = async () => {
    if (!groceryList) return;

    try {
      setIsLoading(true);
      
      const { error } = await supabase
        .from('grocery_list_items')
        .update({ purchased: true })
        .eq('grocery_list_id', groceryList.id);

      if (error) throw error;

      // Update local state
      const allItemIds = new Set(groceryList.items.map(item => item.id));
      setPurchasedItems(allItemIds);

      const updatedItems = groceryList.items.map(item => ({ ...item, purchased: true }));
      setGroceryList({ ...groceryList, items: updatedItems });

      toast.success('All items marked as purchased!');
    } catch (error) {
      console.error('Error marking all items:', error);
      toast.error('Failed to update items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExportList = () => {
    if (!groceryList) return;

    // Create CSV content
    const headers = ['Category', 'Item', 'Amount', 'Unit', 'Purchased'];
    const rows = groceryList.items.map(item => [
      item.category,
      item.ingredient_name,
      item.amount.toString(),
      item.unit,
      item.purchased ? 'Yes' : 'No'
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
    a.download = `grocery-list-${planId.slice(0, 8)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    toast.success('Grocery list exported!');
  };

  const handlePrintList = () => {
    window.print();
  };

  // Group items by category
  const itemsByCategory = groceryList?.items.reduce((acc, item) => {
    if (!acc[item.category]) {
      acc[item.category] = [];
    }
    acc[item.category].push(item);
    return acc;
  }, {} as Record<string, GroceryListItem[]>) || {};

  // Calculate totals
  const totalItems = groceryList?.items.length || 0;
  const purchasedCount = purchasedItems.size;
  const remainingCount = totalItems - purchasedCount;

  // Estimate cost (simplified)
  const estimatedCost = groceryList?.items.reduce((sum, item) => {
    // Very rough estimate based on common ingredients
    const baseCosts: Record<string, number> = {
      protein: 8,
      produce: 3,
      dairy: 4,
      grains: 2,
      pantry: 1,
      other: 2,
    };
    return sum + (baseCosts[item.category] || 2) * (item.amount || 1);
  }, 0) || 0;

  if (!groceryList) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ShoppingCart className="h-5 w-5" />
            Grocery List Generator
          </CardTitle>
          <CardDescription>
            Generate a shopping list from your meal plan ingredients
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="rounded-lg border bg-muted/50 p-6 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-medium">No Grocery List Yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Generate a shopping list based on all ingredients from your 7-day meal plan.
            </p>
            
            <Button
              onClick={handleGenerateList}
              disabled={isGenerating}
              className="mt-6"
              size="lg"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Package className="mr-2 h-4 w-4" />
                  Generate Grocery List
                </>
              )}
            </Button>
          </div>

          <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
            <h4 className="font-medium text-blue-800">📋 What's included?</h4>
            <ul className="mt-2 space-y-1 text-sm text-blue-700">
              <li>• All ingredients from 21 meals (7 days × 3 meals)</li>
              <li>• Organized by category (produce, protein, dairy, etc.)</li>
              <li>• Aggregated quantities to avoid duplicates</li>
              <li>• Estimated cost calculation</li>
              <li>• Printable and exportable format</li>
            </ul>
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
              <ShoppingCart className="h-5 w-5" />
              Grocery List
            </CardTitle>
            <CardDescription>
              {totalItems} items • {purchasedCount} purchased • {remainingCount} remaining
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportList}>
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button variant="outline" size="sm" onClick={handlePrintList}>
              <Printer className="mr-2 h-4 w-4" />
              Print
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{totalItems}</div>
            <div className="text-sm text-muted-foreground">Total items</div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="text-2xl font-bold">{purchasedCount}</div>
            <div className="text-sm text-muted-foreground">Purchased</div>
            <div className="mt-1">
              <Progress value={(purchasedCount / totalItems) * 100} className="h-1" />
            </div>
          </div>
          <div className="rounded-lg border p-3 text-center">
            <div className="flex items-center justify-center gap-1">
              <DollarSign className="h-4 w-4" />
              <div className="text-2xl font-bold">${estimatedCost.toFixed(0)}</div>
            </div>
            <div className="text-sm text-muted-foreground">Estimated cost</div>
          </div>
        </div>

        {/* Grocery List by Category */}
        <div className="space-y-6">
          {Object.entries(itemsByCategory).map(([category, items]) => (
            <div key={category} className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-medium capitalize">{category}</h3>
                <Badge variant="outline">
                  {items.length} {items.length === 1 ? 'item' : 'items'}
                </Badge>
              </div>
              
              <div className="rounded-lg border">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className={`flex items-center justify-between p-3 border-b last:border-b-0 ${
                      purchasedItems.has(item.id) ? 'bg-muted/30' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Checkbox
                        checked={purchasedItems.has(item.id)}
                        onCheckedChange={(checked) => 
                          handleTogglePurchased(item.id, checked as boolean)
                        }
                        disabled={isLoading}
                      />
                      <div>
                        <div className={`font-medium ${
                          purchasedItems.has(item.id) ? 'line-through text-muted-foreground' : ''
                        }`}>
                          {item.ingredient_name}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {item.amount} {item.unit}
                        </div>
                      </div>
                    </div>
                    {purchasedItems.has(item.id) && (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="outline"
            onClick={handleMarkAllPurchased}
            disabled={isLoading || purchasedCount === totalItems}
          >
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <CheckCircle className="mr-2 h-4 w-4" />
            )}
            Mark All Purchased
          </Button>
          
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => checkExistingList()}
              disabled={isLoading}
            >
              Refresh
            </Button>
            <Button
              onClick={handleGenerateList}
              disabled={isGenerating}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Regenerating...
                </>
              ) : (
                'Regenerate List'
              )}
            </Button>
          </div>
        </div>

        {/* Shopping Tips */}
        <div className="rounded-lg border border-amber-100 bg-amber-50 p-4">
          <h4 className="font-medium text-amber-800">🛒 Shopping Tips</h4>
          <ul className="mt-2 space-y-1 text-sm text-amber-700">
            <li>• Shop the perimeter of the store for fresh produce, meat, and dairy</li>
            <li>• Buy in-season produce for better quality and lower cost</li>
            <li>• Consider frozen vegetables for longer shelf life</li>
            <li>• Check your pantry before shopping to avoid duplicates</li>
            <li>• Plan your route through the store to save time</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

// Progress component (simplified version)
function Progress({ value, className }: { value: number; className?: string }) {
  return (
    <div className={`w-full bg-muted rounded-full overflow-hidden ${className}`}>
      <div 
        className="h-full bg-primary transition-all duration-300"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  );
}