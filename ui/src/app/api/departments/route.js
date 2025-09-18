import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { Department } from '@/database/department.model';
import { User } from '@/database/user.model';

// GET /api/departments - Get all departments
export async function GET(request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const departments = await Department.find()
      .select('-__v')
      .sort({ name: 1 });

    // Populate user count for each department
    const departmentsWithUserCount = await Promise.all(
      departments.map(async (dept) => {
        const userCount = await User.countDocuments({ 
          departmentIds: dept.id,
          isActive: true 
        });
        
        return {
          ...dept.toObject(),
          userCount,
        };
      })
    );

    return NextResponse.json(departmentsWithUserCount);
  } catch (error) {
    console.error('Error fetching departments:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/departments - Create a new department
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
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: 'Department name is required' }, { status: 400 });
    }

    // Check if department already exists
    const existingDepartment = await Department.findOne({ name });
    if (existingDepartment) {
      return NextResponse.json({ error: 'Department already exists' }, { status: 409 });
    }

    const department = new Department({
      name,
      description,
      createdBy: session.user.email,
    });

    await department.save();

    return NextResponse.json(department, { status: 201 });
  } catch (error) {
    console.error('Error creating department:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
