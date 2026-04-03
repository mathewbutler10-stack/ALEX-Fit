'use client';

import { createContext, useContext, useState, ReactNode } from 'react';
import { DndContext, DragEndEvent, DragOverlay, DragStartEvent, closestCorners } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { MealPlanSlot } from '@/types/meal-plan';

interface DragDropContextType {
  activeId: string | null;
  items: MealPlanSlot[];
  setItems: (items: MealPlanSlot[]) => void;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
}

const DragDropContext = createContext<DragDropContextType | undefined>(undefined);

interface DragDropProviderProps {
  children: ReactNode;
  initialItems: MealPlanSlot[];
  onItemsChange?: (items: MealPlanSlot[]) => void;
  onItemMove?: (itemId: string, newDay: number, newMealType: string) => Promise<void>;
}

export function DragDropProvider({ 
  children, 
  initialItems, 
  onItemsChange,
  onItemMove 
}: DragDropProviderProps) {
  const [items, setItems] = useState<MealPlanSlot[]>(initialItems);
  const [activeId, setActiveId] = useState<string | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    const activeId = active.id as string;
    const overId = over.id as string;

    // If dragging within the same container (reordering)
    if (activeId !== overId) {
      const oldIndex = items.findIndex(item => item.id === activeId);
      const newIndex = items.findIndex(item => item.id === overId);
      
      if (oldIndex !== -1 && newIndex !== -1) {
        const newItems = arrayMove(items, oldIndex, newIndex);
        setItems(newItems);
        
        if (onItemsChange) {
          onItemsChange(newItems);
        }
      }
    }

    // If dropping into a different day/meal type container
    if (over.data?.current?.type === 'day-slot') {
      const slotData = over.data.current;
      const draggedItem = items.find(item => item.id === activeId);
      
      if (draggedItem && onItemMove) {
        try {
          await onItemMove(
            draggedItem.id,
            slotData.dayNumber,
            slotData.mealType
          );
          
          // Update local state
          const updatedItems = items.map(item => {
            if (item.id === activeId) {
              return {
                ...item,
                day_number: slotData.dayNumber,
                meal_type: slotData.mealType,
              };
            }
            return item;
          });
          
          setItems(updatedItems);
          
          if (onItemsChange) {
            onItemsChange(updatedItems);
          }
        } catch (error) {
          console.error('Error moving item:', error);
          // Revert to original items on error
          setItems([...items]);
        }
      }
    }

    setActiveId(null);
  };

  const value = {
    activeId,
    items,
    setItems,
    handleDragStart,
    handleDragEnd,
  };

  return (
    <DragDropContext.Provider value={value}>
      <DndContext
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          {children}
        </SortableContext>
        <DragOverlay>
          {activeId ? (
            <div className="rounded-lg border bg-background p-4 shadow-lg opacity-80">
              <div className="font-medium">
                {items.find(item => item.id === activeId)?.meal?.name || 'Meal'}
              </div>
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </DragDropContext.Provider>
  );
}

export function useDragDrop() {
  const context = useContext(DragDropContext);
  if (context === undefined) {
    throw new Error('useDragDrop must be used within a DragDropProvider');
  }
  return context;
}