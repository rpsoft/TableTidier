import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { User } from '@/database/user.model';
import { Department } from '@/database/department.model';

// GET /api/users - Get all users (admin only)
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const users = await User.find({ isActive: true })
      .select('-__v')
      .sort({ name: 1 });

    // Populate department information
    const usersWithDepartments = await Promise.all(
      users.map(async (user) => {
        const departments = await Department.find({ 
          id: { $in: user.departmentIds } 
        }).select('id name');
        
        return {
          ...user.toObject(),
          departments: departments.map(d => ({ id: d.id, name: d.name })),
        };
      })
    );

    return NextResponse.json(usersWithDepartments);
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/users - Create a new user (admin only)
export async function POST(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const currentUser = await User.findOne({ email: session.user.email });
    if (!currentUser || !currentUser.roles.includes('admin')) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, departmentIds, roles } = body;

    if (!name || !email) {
      return NextResponse.json({ error: 'Name and email are required' }, { status: 400 });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json({ error: 'User already exists' }, { status: 409 });
    }

    // Validate departments exist
    if (departmentIds && departmentIds.length > 0) {
      const departments = await Department.find({ id: { $in: departmentIds } });
      if (departments.length !== departmentIds.length) {
        return NextResponse.json({ error: 'One or more departments not found' }, { status: 400 });
      }
    }

    const user = new User({
      name,
      email,
      departmentIds: departmentIds || [],
      roles: roles || ['viewer'],
    });

    await user.save();

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error('Error creating user:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
