'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, Star, Heart, Flame, Repeat, AlertCircle, Send } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

interface MealRatingProps {
  mealId: string;
  clientId: string;
  mealName: string;
  onRatingSubmitted?: (rating: number) => void;
  compact?: boolean;
}

type QuickFeedback = 'loved' | 'too_spicy' | 'will_make_again' | 'too_complicated';

export function MealRating({ 
  mealId, 
  clientId, 
  mealName, 
  onRatingSubmitted,
  compact = false 
}: MealRatingProps) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [feedback, setFeedback] = useState('');
  const [quickFeedback, setQuickFeedback] = useState<QuickFeedback | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);

  const quickFeedbackOptions: Array<{
    value: QuickFeedback;
    label: string;
    icon: React.ReactNode;
    color: string;
  }> = [
    {
      value: 'loved',
      label: 'Loved it!',
      icon: <Heart className="h-4 w-4" />,
      color: 'text-red-600 bg-red-50 border-red-200',
    },
    {
      value: 'too_spicy',
      label: 'Too spicy',
      icon: <Flame className="h-4 w-4" />,
      color: 'text-orange-600 bg-orange-50 border-orange-200',
    },
    {
      value: 'will_make_again',
      label: 'Will make again',
      icon: <Repeat className="h-4 w-4" />,
      color: 'text-green-600 bg-green-50 border-green-200',
    },
    {
      value: 'too_complicated',
      label: 'Too complicated',
      icon: <AlertCircle className="h-4 w-4" />,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
    },
  ];

  const handleSubmitRating = async () => {
    if (rating === 0) {
      toast.error('Please select a star rating');
      return;
    }

    try {
      setIsSubmitting(true);

      const response = await fetch(`/api/meals/${mealId}/rate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          rating,
          feedback: feedback || null,
          quick_feedback: quickFeedback,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to submit rating');
      }

      const data = await response.json();
      
      setHasSubmitted(true);
      toast.success('Rating submitted! Thank you for your feedback.');
      
      if (onRatingSubmitted) {
        onRatingSubmitted(rating);
      }
    } catch (error) {
      console.error('Error submitting rating:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to submit rating');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickFeedbackClick = (value: QuickFeedback) => {
    if (quickFeedback === value) {
      setQuickFeedback(null);
    } else {
      setQuickFeedback(value);
    }
  };

  if (hasSubmitted && compact) {
    return (
      <div className="rounded-lg border border-green-200 bg-green-50 p-3">
        <div className="flex items-center gap-2">
          <Star className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-green-800">Rating submitted!</span>
        </div>
        <p className="mt-1 text-xs text-green-700">
          Thank you for your feedback on "{mealName}"
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="space-y-3">
        <div>
          <Label className="text-sm">Rate this meal</Label>
          <div className="mt-1 flex gap-1">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1"
              >
                <Star
                  className={`h-5 w-5 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {quickFeedbackOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => handleQuickFeedbackClick(option.value)}
              className={`rounded border p-2 text-xs transition-colors ${
                quickFeedback === option.value
                  ? option.color
                  : 'border-gray-200 hover:bg-gray-50'
              }`}
            >
              <div className="flex items-center gap-1">
                {option.icon}
                <span>{option.label}</span>
              </div>
            </button>
          ))}
        </div>

        <Textarea
          placeholder="Additional feedback (optional)"
          value={feedback}
          onChange={(e) => setFeedback(e.target.value)}
          className="min-h-[60px] text-sm"
        />

        <Button
          onClick={handleSubmitRating}
          disabled={rating === 0 || isSubmitting}
          size="sm"
          className="w-full"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-3 w-3 animate-spin" />
              Submitting...
            </>
          ) : (
            <>
              <Send className="mr-2 h-3 w-3" />
              Submit Rating
            </>
          )}
        </Button>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Star className="h-5 w-5" />
          Rate Your Meal
        </CardTitle>
        <CardDescription>
          How was "{mealName}"? Your feedback helps improve future recommendations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Star Rating */}
        <div className="space-y-3">
          <Label>Overall Rating</Label>
          <div className="flex gap-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-2 transition-transform hover:scale-110"
              >
                <Star
                  className={`h-8 w-8 ${
                    star <= (hoverRating || rating)
                      ? 'fill-yellow-500 text-yellow-500'
                      : 'text-gray-300'
                  }`}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Poor</span>
            <span>Excellent</span>
          </div>
        </div>

        {/* Quick Feedback */}
        <div className="space-y-3">
          <Label>Quick Feedback</Label>
          <div className="grid grid-cols-2 gap-3">
            {quickFeedbackOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleQuickFeedbackClick(option.value)}
                className={`rounded-lg border p-3 transition-all ${
                  quickFeedback === option.value
                    ? `${option.color} border-2`
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-2">
                  {option.icon}
                  <span className="font-medium">{option.label}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detailed Feedback */}
        <div className="space-y-3">
          <Label htmlFor="detailed-feedback">
            Detailed Feedback (Optional)
          </Label>
          <Textarea
            id="detailed-feedback"
            placeholder="What did you like or dislike about this meal? Any suggestions for improvement?"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
            className="min-h-[100px]"
          />
        </div>

        {/* Submit Button */}
        <Button
          onClick={handleSubmitRating}
          disabled={rating === 0 || isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting Rating...
            </>
          ) : (
            <>
              <Star className="mr-2 h-4 w-4" />
              Submit Rating
            </>
          )}
        </Button>

        {/* Privacy Note */}
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-3">
          <p className="text-sm text-blue-700">
            💡 Your ratings are private and only visible to your personal trainer. 
            They help personalize your future meal recommendations.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}