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

    const { title } = await request.json();

    if (!title) {
      return NextResponse.json(
        { error: "Title is required" },
        { status: 400 }
      );
    }

    // Check if user has access to the column's board
    const column = await prisma.column.findFirst({
      where: { id: params.id },
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
        { error: "You don't have permission to edit this column" },
        { status: 403 }
      );
    }

    const updatedColumn = await prisma.column.update({
      where: { id: params.id },
      data: { title },
      include: {
        tasks: {
          include: {
            assignee: {
              select: { id: true, name: true, email: true }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json(updatedColumn);
  } catch (error) {
    console.error("Error updating column:", error);
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

    // Check if user has access to the column's board
    const column = await prisma.column.findFirst({
      where: { id: params.id },
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
        { error: "You don't have permission to delete this column" },
        { status: 403 }
      );
    }

    await prisma.column.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Column deleted successfully" });
  } catch (error) {
    console.error("Error deleting column:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
