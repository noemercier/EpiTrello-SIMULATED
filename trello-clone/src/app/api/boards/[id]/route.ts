import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        OR: [
          { ownerId: session.user?.id },
          { members: { some: { id: session.user?.id } } }
        ]
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { id: true, name: true, email: true }
        },
        columns: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: { id: true, name: true, email: true }
                }
              },
              orderBy: { order: "asc" }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    });

    if (!board) {
      return NextResponse.json({ error: "Board not found" }, { status: 404 });
    }

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error fetching board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
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

    // Check if user owns the board
    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        ownerId: session.user?.id
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found or you don't have permission to edit it" },
        { status: 404 }
      );
    }

    const updatedBoard = await prisma.board.update({
      where: { id: params.id },
      data: { title },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { id: true, name: true, email: true }
        },
        columns: {
          include: {
            tasks: {
              include: {
                assignee: {
                  select: { id: true, name: true, email: true }
                }
              },
              orderBy: { order: "asc" }
            }
          },
          orderBy: { order: "asc" }
        }
      }
    });

    return NextResponse.json(updatedBoard);
  } catch (error) {
    console.error("Error updating board:", error);
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

    // Check if user owns the board
    const board = await prisma.board.findFirst({
      where: {
        id: params.id,
        ownerId: session.user?.id
      }
    });

    if (!board) {
      return NextResponse.json(
        { error: "Board not found or you don't have permission to delete it" },
        { status: 404 }
      );
    }

    await prisma.board.delete({
      where: { id: params.id }
    });

    return NextResponse.json({ message: "Board deleted successfully" });
  } catch (error) {
    console.error("Error deleting board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
