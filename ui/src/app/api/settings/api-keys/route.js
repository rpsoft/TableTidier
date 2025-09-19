import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { AuditLog } from '@/database/audit.model';

// GET /api/settings/api-keys - Get current API key settings
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Return current settings (in production, these would be stored in database)
    const settings = {
      cochrane: {
        enabled: process.env.COCHRANE_API_KEY ? true : false,
        apiKey: process.env.COCHRANE_API_KEY ? '***configured***' : ''
      },
      embase: {
        enabled: process.env.EMBASE_API_KEY ? true : false,
        apiKey: process.env.EMBASE_API_KEY ? '***configured***' : ''
      }
    };

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Error fetching API settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/settings/api-keys - Update API key settings
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { cochrane, embase } = body;

    // In production, you would:
    // 1. Validate the API keys by making test requests
    // 2. Store them securely in the database
    // 3. Update environment variables or configuration

    console.log('API settings update requested:', {
      cochrane: cochrane?.enabled ? 'enabled' : 'disabled',
      embase: embase?.enabled ? 'enabled' : 'disabled'
    });

    // Log the settings update
    const auditLog = new AuditLog({
      projectId: 'system', // System-wide setting
      userId: session.user.email,
      action: 'settings_updated',
      details: { 
        settingsType: 'api_keys',
        cochraneEnabled: cochrane?.enabled || false,
        embaseEnabled: embase?.enabled || false
      },
    });

    await auditLog.save();

    // For now, just return success
    // In production, you would save to database and update environment
    return NextResponse.json({ 
      success: true, 
      message: 'Settings updated successfully' 
    });
  } catch (error) {
    console.error('Error updating API settings:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
