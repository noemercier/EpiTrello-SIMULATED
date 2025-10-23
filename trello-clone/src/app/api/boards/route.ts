import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../lib/auth";
import { prisma } from "../../lib/prisma";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const boards = await prisma.board.findMany({
      where: {
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
        _count: {
          select: { columns: true }
        }
      },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json(boards);
  } catch (error) {
    console.error("Error fetching boards:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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

    const board = await prisma.board.create({
      data: {
        title,
        ownerId: session.user?.id!,
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true }
        },
        members: {
          select: { id: true, name: true, email: true }
        },
        _count: {
          select: { columns: true }
        }
      }
    });

    return NextResponse.json(board);
  } catch (error) {
    console.error("Error creating board:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
