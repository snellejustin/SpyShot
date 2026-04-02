# Supabase Setup Guide for SpyShot App

## 🚀 **Step 1: Create Supabase Account & Project**

1. **Go to [Supabase](https://supabase.com/)**
2. **Sign up** with GitHub/Google or email
3. **Create a new project:**
   - Project name: `SpyShot`
   - Database password: (choose a strong password)
   - Region: Choose closest to your users

## 🗄️ **Step 2: Set Up Database Schema**

### **Create the profiles table:**

Go to your Supabase Dashboard → SQL Editor → New query, and run:

```sql
-- Create profiles table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  bio TEXT DEFAULT '',
  profile_picture TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();
```

## 📁 **Step 3: Set Up Storage**

### **Create storage bucket for profile pictures:**

1. **Go to Storage** in Supabase Dashboard
2. **Create new bucket:**
   - Name: `profile-pictures`
   - Public: `Yes` (so images can be displayed)
3. **Set up storage policies** (run in SQL Editor):

```sql
-- Storage policies for profile pictures
INSERT INTO storage.buckets (id, name, public) 
VALUES ('profile-pictures', 'profile-pictures', true);

-- Allow authenticated users to upload profile pictures
CREATE POLICY "Users can upload profile pictures" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'profile-pictures' 
    AND auth.role() = 'authenticated'
  );

-- Allow users to update their own profile pictures
CREATE POLICY "Users can update own profile pictures" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'profile-pictures' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- Allow public access to view profile pictures
CREATE POLICY "Public can view profile pictures" ON storage.objects
  FOR SELECT USING (bucket_id = 'profile-pictures');
```

## ⚙️ **Step 4: Get Your Credentials**

1. **Go to Settings** → **API**
2. **Copy these values:**
   - **Project URL** (looks like: `https://abcdefgh.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

## 🔧 **Step 5: Update Your App Config**

Update `/config/supabase.ts`:

```typescript
const supabaseUrl = "https://your-project.supabase.co"; // Your Project URL
const supabaseAnonKey = "your-anon-key"; // Your Anon Key
```

## 🔐 **Step 6: Configure Authentication**

1. **Go to Authentication** → **Settings**
2. **Disable email confirmations** (for development):
   - Turn OFF "Enable email confirmations"
3. **Set up auth providers** (optional):
   - You can add Google, GitHub, etc. later

## ✅ **Step 7: Test Your Setup**

Run your app:

```bash
npm start
```

Try:

1. **Register** a new account
2. **Login** with existing account
3. **Update profile** information
4. **Upload profile picture**

## 🔍 **Verify Data in Supabase**

- Check **Table Editor** → `profiles` to see user data
- Check **Storage** → `profile-pictures` to see uploaded images
- Check **Authentication** → **Users** to see registered users

## 🛠️ **Optional: Database Functions**

For advanced features, you can add these database functions:

```sql
-- Function to handle user signup trigger
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ language plpgsql security definer;

-- Trigger for automatic profile creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

---

## 🎉 **You're Done!**

Your SpyShot app now has:

- ✅ **User authentication** (register/login)
- ✅ **Profile management** with database storage
- ✅ **Profile picture uploads** with cloud storage
- ✅ **Real-time sync** across devices
- ✅ **Row-level security** for data protection

**Next**: Test the app and start building your group features! 🚀
