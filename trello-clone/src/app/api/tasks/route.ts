import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, description, columnId, dueDate, assigneeId } = await request.json();

    if (!title || !columnId) {
      return NextResponse.json(
        { error: "Title and columnId are required" },
        { status: 400 }
      );
    }

    // Check if user has access to the column's board
    const column = await prisma.column.findFirst({
      where: { id: columnId },
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
    });

    if (!column) {
      return NextResponse.json({ error: "Column not found" }, { status: 404 });
    }

    const hasAccess = column.board.ownerId === session.user?.id ||
      column.board.members.some(member => member.id === session.user?.id);

    if (!hasAccess) {
      return NextResponse.json(
        { error: "You don't have permission to add tasks to this column" },
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

    // Get the next order number for the column
    const lastTask = await prisma.task.findFirst({
      where: { columnId },
      orderBy: { order: "desc" }
    });

    const nextOrder = lastTask ? lastTask.order + 1 : 0;

    const task = await prisma.task.create({
      data: {
        title,
        description,
        columnId,
        dueDate: dueDate ? new Date(dueDate) : null,
        assigneeId,
        order: nextOrder,
      },
      include: {
        assignee: {
          select: { id: true, name: true, email: true }
        }
      }
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
