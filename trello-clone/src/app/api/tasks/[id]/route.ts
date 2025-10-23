import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, dueDate, assigneeId } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check if user has access to the task's board
    const task = await prisma.task.findFirst({
      where: { id: params.id },
      include: {
        column: {
          include: {
            board: {
              select: {
                ownerId: true,
                members: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const hasAccess = task.column.board.ownerId === session.user?.id ||
      task.column.board.members.some(member => member.id === session.user?.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to edit this task" },
        { status: 403 }
      );
    }

    // If assignee is specified, validate it's a valid user
    if (assigneeId) {
      const assignee = await prisma.user.findUnique({
        where: { id: assigneeId }
      });

      if (!assignee) {
        return NextResponse.json(
          { error: "Assignee not found" },
          { status: 400 }
        );
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id: params.id },
      data: {
        title,
        description,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId: assigneeId || null,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user has access to the task's board
    const task = await prisma.task.findFirst({
      where: { id: params.id },
      include: {
        column: {
          include: {
            board: {
              select: {
                ownerId: true,
                members: {
                  select: { id: true }
                }
              }
            }
          }
        }
      }
    });

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const hasAccess = task.column.board.ownerId === session.user?.id ||
      task.column.board.members.some(member => member.id === session.user?.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to delete this task" },
        { status: 403 }
      );
    }

    await prisma.task.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
