import { Hono } from 'hono';
import { setCookie } from 'hono/cookie';
import { supabase } from '../utils/supabase-db';
import { transformArray } from '../utils/field-transformer';

const app = new Hono();

// Basic password hashing (in production, use bcrypt)
function hashPassword(password: string): string {
  // Simple hash for demo - replace with bcrypt in production
  return Buffer.from(password).toString('base64');
}

function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

// Sign up endpoint
app.post('/signup', async (c) => {
  try {
    const { email, username, password } = await c.req.json();

    if (!email || !username || !password) {
      return c.json({ success: false, error: 'Email, username, and password are required' }, 400);
    }

    // Check if user already exists
    const { data: existingUser } = await supabase
      .from('users')
      .select('id')
      .or(`email.eq.${email},username.eq.${username}`)
      .single();

    if (existingUser) {
      return c.json({ success: false, error: 'User already exists with that email or username' }, 409);
    }

    // Create new user
    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        username,
        password_hash: hashPassword(password)
      })
      .select()
      .single();

    if (error) {
      console.error('Database error creating user:', error);
      return c.json({ success: false, error: 'Failed to create user' }, 500);
    }

    // Set session cookie
    setCookie(c, 'session_user_id', newUser.id, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return c.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        username: newUser.username
      }
    });

  } catch (error: any) {
    console.error('Signup error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Login endpoint
app.post('/login', async (c) => {
  try {
    const { email, password } = await c.req.json();

    if (!email || !password) {
      return c.json({ success: false, error: 'Email and password are required' }, 400);
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error || !user) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    // Verify password
    if (!verifyPassword(password, user.password_hash)) {
      return c.json({ success: false, error: 'Invalid email or password' }, 401);
    }

    // Set session cookie
    setCookie(c, 'session_user_id', user.id, {
      httpOnly: true,
      secure: false, // Set to true in production with HTTPS
      sameSite: 'Lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username
      }
    });

  } catch (error: any) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

// Logout endpoint
app.post('/logout', async (c) => {
  setCookie(c, 'session_user_id', '', {
    httpOnly: true,
    secure: false,
    sameSite: 'Lax',
    maxAge: 0, // Expire immediately
    path: '/'
  });

  return c.json({ success: true });
});

// Get current user endpoint
app.get('/me', async (c) => {
  try {
    const sessionUserId = c.get('userId'); // Get user ID from auth middleware context

    if (!sessionUserId) {
      return c.json({ success: false, error: 'Not authenticated' }, 401);
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, username, created_at')
      .eq('id', sessionUserId)
      .single();

    if (error || !user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        createdAt: user.created_at
      }
    });

  } catch (error: any) {
    console.error('Get user error:', error);
    return c.json({ success: false, error: 'Internal server error' }, 500);
  }
});

export default app;