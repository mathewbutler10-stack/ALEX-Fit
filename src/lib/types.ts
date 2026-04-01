export type UserRole = 'owner' | 'pt' | 'client'
export type UserStatus = 'active' | 'inactive' | 'suspended'

export interface User {
  id: string
  email: string
  role: UserRole
  full_name: string | null
  avatar_url: string | null
  status: UserStatus
  gym_id: string | null
  created_at: string
  updated_at: string
}

export interface Gym {
  id: string
  name: string
  abn: string | null
  logo_url: string | null
  owner_id: string
  created_at: string
  updated_at: string
}

export interface PT {
  id: string
  user_id: string
  gym_id: string
  abn: string | null
  phone: string | null
  address: string | null
  suburb: string | null
  state: string | null
  postcode: string | null
  bio: string | null
  specialisations: string[]
  rating: number
  payout_tier: string
  payout_rate: number
  max_clients: number
  prefers_virtual: boolean
  prefers_in_person: boolean
  prefers_nutrition: boolean
  joined_date: string
  status: 'active' | 'inactive'
  created_at: string
  updated_at: string
  // Joined
  user?: User
}

export interface Client {
  id: string
  user_id: string
  gym_id: string
  assigned_pt_id: string | null
  subscription_type: string | null
  phone: string | null
  mobile: string | null
  address: string | null
  date_of_birth: string | null
  preferred_contact: string | null
  preferred_contact_detail: string | null
  contact_notes: string | null
  emergency_name: string | null
  emergency_phone: string | null
  emergency_rel: string | null
  calorie_goal: number
  protein_goal: number
  carbs_goal: number
  fat_goal: number
  weekly_workout_goal: number
  goals: string | null
  context: string | null
  motivation: string | null
  pt_notes: string | null
  at_risk: boolean
  last_login_at: string | null
  created_at: string
  updated_at: string
  // Joined
  user?: User
  pt?: PT
}

export interface Meal {
  id: string
  name: string
  calories: number
  protein: number
  carbs: number
  fat: number
  prep_time_minutes: number | null
  difficulty: 'easy' | 'medium' | 'hard' | null
  dietary_flags: string[] | null
  cuisine: string | null
  ingredients: any[] | null // jsonb array (can be string[] or structured objects)
  instructions: string | null
  ease_rating: number | null
  allergens: string[] | null
  equipment_required: string[] | null
  tags: string[] | null
  created_by: string | null
  is_global: boolean
  gym_id: string | null
  created_at: string
}

export interface Workout {
  id: string
  gym_id: string | null
  name: string
  focus: string | null
  difficulty: string | null
  description: string | null
  exercises: string[]
  created_by: string | null
  is_global: boolean
  created_at: string
}

export interface Appointment {
  id: string
  client_id: string
  pt_id: string
  gym_id: string
  title: string
  type: string
  date: string
  start_time: string
  end_time: string
  location: string | null
  notes: string | null
  status: string
  ics_uid: string | null
  created_at: string
  updated_at: string
  // Joined
  client?: Client
  pt?: PT
}

export interface Message {
  id: string
  client_id: string
  gym_id: string
  sender_id: string
  sender_role: string
  text: string
  read_at: string | null
  created_at: string
  // Joined
  sender?: User
}

export interface SubscriptionPlan {
  id: string
  gym_id: string
  name: string
  description: string | null
  monthly_price: number
  quarterly_price: number
  annual_price: number
  setup_fee: number
  currency: string
  features: string[]
  color: string | null
  active: boolean
  stripe_product_id: string | null
  created_at: string
}

export interface DiscountCode {
  id: string
  gym_id: string
  code: string
  description: string | null
  type: string
  value: number
  frequency: string | null
  applies_to: string[]
  max_uses: number | null
  used_count: number
  valid_until: string | null
  active: boolean
}

export interface Perk {
  id: string
  gym_id: string
  category: string | null
  partner_name: string
  description: string | null
  discount_code: string | null
  price: string | null
  applicable_subs: string[]
  active: boolean
  created_at: string
}

export interface NewSignup {
  id: string
  gym_id: string
  name: string
  email: string
  preferred_sub: string | null
  signup_date: string
  assigned_pt_id: string | null
  status: string
  created_at: string
}
