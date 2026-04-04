import { createClient } from '@/lib/supabase/server';
import { NextRequest, NextResponse } from 'next/server';

// Simple discount code system using existing schema
// We'll store discount codes in a JSON column or separate table
// For now, using a simple in-memory approach

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed' | 'trial';
  value: number; // percentage (e.g., 20) or fixed amount (e.g., 50)
  description: string;
  validFrom: string;
  validUntil: string;
  maxUses: number;
  usedCount: number;
  appliesTo: 'all' | 'starter' | 'growth' | 'pro';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
}

// In-memory store (in production, use database)
const discountCodes: DiscountCode[] = [
  {
    id: '1',
    code: 'LAUNCH20',
    type: 'percentage',
    value: 20,
    description: 'Launch discount - 20% off first month',
    validFrom: '2026-04-01',
    validUntil: '2026-06-30',
    maxUses: 100,
    usedCount: 15,
    appliesTo: 'all',
    isActive: true,
    createdBy: 'system',
    createdAt: '2026-04-01T00:00:00Z'
  },
  {
    id: '2',
    code: 'FIRSTMONTH',
    type: 'fixed',
    value: 50,
    description: '$50 off first month',
    validFrom: '2026-04-01',
    validUntil: '2026-12-31',
    maxUses: 500,
    usedCount: 42,
    appliesTo: 'all',
    isActive: true,
    createdBy: 'system',
    createdAt: '2026-04-01T00:00:00Z'
  },
  {
    id: '3',
    code: 'GYM30',
    type: 'percentage',
    value: 30,
    description: '30% off for gym partnerships',
    validFrom: '2026-04-01',
    validUntil: '2026-05-31',
    maxUses: 50,
    usedCount: 8,
    appliesTo: 'pro',
    isActive: true,
    createdBy: 'system',
    createdAt: '2026-04-01T00:00:00Z'
  }
];

// GET /api/gym/discounts - List all discount codes (owner only)
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is owner
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Owner access required' },
        { status: 403 }
      );
    }
    
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search');
    
    let filteredCodes = [...discountCodes];
    
    // Filter by active status
    if (activeOnly) {
      filteredCodes = filteredCodes.filter(code => code.isActive);
    }
    
    // Filter by search term
    if (search) {
      const searchLower = search.toLowerCase();
      filteredCodes = filteredCodes.filter(code => 
        code.code.toLowerCase().includes(searchLower) ||
        code.description.toLowerCase().includes(searchLower)
      );
    }
    
    // Calculate usage statistics
    const stats = {
      total: discountCodes.length,
      active: discountCodes.filter(c => c.isActive).length,
      expired: discountCodes.filter(c => new Date(c.validUntil) < new Date()).length,
      totalUses: discountCodes.reduce((sum, code) => sum + code.usedCount, 0),
      totalDiscountValue: discountCodes.reduce((sum, code) => {
        // Estimate discount value (simplified)
        const avgSubscriptionValue = 500; // Average monthly subscription
        return sum + (code.usedCount * (code.type === 'percentage' ? 
          avgSubscriptionValue * (code.value / 100) : code.value));
      }, 0)
    };
    
    return NextResponse.json({
      discountCodes: filteredCodes,
      stats,
      pagination: {
        total: filteredCodes.length,
        page: 1,
        limit: filteredCodes.length
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in GET /api/gym/discounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gym/discounts - Create new discount code (owner only)
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Check if user is owner
    const { data: profile, error: profileError } = await supabase
      .from('users')
      .select('role')
      .eq('id', user.id)
      .single();
    
    if (profileError || !profile || profile.role !== 'owner') {
      return NextResponse.json(
        { error: 'Owner access required' },
        { status: 403 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    
    // Validate required fields
    const { code, type, value, description, validUntil, maxUses, appliesTo } = body;
    
    if (!code || !type || !value || !description || !validUntil || !maxUses || !appliesTo) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate code format
    if (!/^[A-Z0-9]{4,20}$/.test(code)) {
      return NextResponse.json(
        { error: 'Discount code must be 4-20 uppercase alphanumeric characters' },
        { status: 400 }
      );
    }
    
    // Check if code already exists
    if (discountCodes.some(dc => dc.code === code)) {
      return NextResponse.json(
        { error: 'Discount code already exists' },
        { status: 400 }
      );
    }
    
    // Validate value based on type
    if (type === 'percentage' && (value < 1 || value > 100)) {
      return NextResponse.json(
        { error: 'Percentage must be between 1 and 100' },
        { status: 400 }
      );
    }
    
    if (type === 'fixed' && value < 1) {
      return NextResponse.json(
        { error: 'Fixed amount must be positive' },
        { status: 400 }
      );
    }
    
    // Create new discount code
    const newDiscount: DiscountCode = {
      id: `disc_${Date.now()}`,
      code: code.toUpperCase(),
      type,
      value,
      description,
      validFrom: new Date().toISOString().split('T')[0],
      validUntil,
      maxUses,
      usedCount: 0,
      appliesTo,
      isActive: true,
      createdBy: user.id,
      createdAt: new Date().toISOString()
    };
    
    // Add to in-memory store (in production, save to database)
    discountCodes.push(newDiscount);
    
    return NextResponse.json({
      success: true,
      discountCode: newDiscount,
      message: 'Discount code created successfully'
    }, { status: 201 });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/gym/discounts:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gym/discounts/validate - Validate discount code
export async function POSTValidate(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Parse request body
    const body = await request.json();
    const { code, subscriptionTier } = body;
    
    if (!code) {
      return NextResponse.json(
        { error: 'Discount code is required' },
        { status: 400 }
      );
    }
    
    // Find discount code
    const discountCode = discountCodes.find(dc => 
      dc.code === code.toUpperCase() && 
      dc.isActive
    );
    
    if (!discountCode) {
      return NextResponse.json(
        { 
          valid: false,
          error: 'Invalid discount code'
        },
        { status: 404 }
      );
    }
    
    // Check if code has expired
    const today = new Date().toISOString().split('T')[0];
    if (today > discountCode.validUntil) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Discount code has expired'
        },
        { status: 400 }
      );
    }
    
    // Check if code has reached max uses
    if (discountCode.usedCount >= discountCode.maxUses) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Discount code has been fully redeemed'
        },
        { status: 400 }
      );
    }
    
    // Check if code applies to this subscription tier
    if (discountCode.appliesTo !== 'all' && discountCode.appliesTo !== subscriptionTier) {
      return NextResponse.json(
        {
          valid: false,
          error: `Discount code only applies to ${discountCode.appliesTo} tier`
        },
        { status: 400 }
      );
    }
    
    // Calculate discount amount
    let discountAmount = 0;
    let discountMessage = '';
    
    if (discountCode.type === 'percentage') {
      discountAmount = discountCode.value;
      discountMessage = `${discountCode.value}% off`;
    } else if (discountCode.type === 'fixed') {
      discountAmount = discountCode.value;
      discountMessage = `$${discountCode.value} off`;
    } else if (discountCode.type === 'trial') {
      discountAmount = discountCode.value;
      discountMessage = `${discountCode.value}-day free trial`;
    }
    
    return NextResponse.json({
      valid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        type: discountCode.type,
        value: discountCode.value,
        description: discountCode.description,
        discountAmount,
        discountMessage,
        remainingUses: discountCode.maxUses - discountCode.usedCount,
        validUntil: discountCode.validUntil
      }
    });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/gym/discounts/validate:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/gym/discounts/redeem - Redeem discount code
export async function POSTRedeem(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }
    
    // Parse request body
    const body = await request.json();
    const { code, subscriptionTier, gymId } = body;
    
    if (!code || !subscriptionTier || !gymId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Find discount code
    const discountCode = discountCodes.find(dc => 
      dc.code === code.toUpperCase() && 
      dc.isActive
    );
    
    if (!discountCode) {
      return NextResponse.json(
        { error: 'Invalid discount code' },
        { status: 404 }
      );
    }
    
    // Validate code (reuse validation logic)
    const today = new Date().toISOString().split('T')[0];
    if (today > discountCode.validUntil) {
      return NextResponse.json(
        { error: 'Discount code has expired' },
        { status: 400 }
      );
    }
    
    if (discountCode.usedCount >= discountCode.maxUses) {
      return NextResponse.json(
        { error: 'Discount code has been fully redeemed' },
        { status: 400 }
      );
    }
    
    if (discountCode.appliesTo !== 'all' && discountCode.appliesTo !== subscriptionTier) {
      return NextResponse.json(
        { error: `Discount code only applies to ${discountCode.appliesTo} tier` },
        { status: 400 }
      );
    }
    
    // Increment usage count (in production, save to database)
    discountCode.usedCount += 1;
    
    // Record redemption (in production, save to database)
    const redemptionRecord = {
      id: `redemption_${Date.now()}`,
      discountCodeId: discountCode.id,
      userId: user.id,
      gymId,
      subscriptionTier,
      redeemedAt: new Date().toISOString(),
      discountValue: discountCode.value,
      discountType: discountCode.type
    };
    
    // Calculate final price
    const subscriptionPrices = {
      starter: 299,
      growth: 599,
      pro: 1199
    };
    
    const basePrice = subscriptionPrices[subscriptionTier as keyof typeof subscriptionPrices] || 299;
    let finalPrice = basePrice;
    
    if (discountCode.type === 'percentage') {
      finalPrice = basePrice * (1 - discountCode.value / 100);
    } else if (discountCode.type === 'fixed') {
      finalPrice = Math.max(0, basePrice - discountCode.value);
    } else if (discountCode.type === 'trial') {
      finalPrice = 0; // Free trial
    }
    
    return NextResponse.json({
      success: true,
      redemption: redemptionRecord,
      pricing: {
        basePrice,
        discount: {
          type: discountCode.type,
          value: discountCode.value,
          amount: basePrice - finalPrice
        },
        finalPrice,
        savings: basePrice - finalPrice
      },
      message: 'Discount code applied successfully'
    });
    
  } catch (error) {
    console.error('Unexpected error in POST /api/gym/discounts/redeem:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}