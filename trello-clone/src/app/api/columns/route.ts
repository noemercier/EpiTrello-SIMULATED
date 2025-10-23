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

    const { title, boardId } = await request.json();

    if (!title || !boardId) {
      return NextResponse.json(
        { error: "Title and boardId are required" },
        { status: 400 }
      );
    }

    // Check if user has access to the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { ownerId: session.user?.id },
          { members: { some: { id: session.user?.id } } }
        ]
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found or you don't have permission to add columns" },
        { status: 404 }
      );
    }

    // Get the next order number
    const lastColumn = await prisma.column.findFirst({
      where: { boardId },
      orderBy: { order: "desc" }
    });

    const nextOrder = lastColumn ? lastColumn.order + 1 : 0;

    const column = await prisma.column.create({
      data: {
        title,
        boardId,
        order: nextOrder,
      },
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

    return NextResponse.json(column);
  } catch (error) {
    console.error("Error creating column:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
