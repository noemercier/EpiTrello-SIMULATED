import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../../lib/auth";
import { prisma } from "../../../lib/prisma";

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tasks } = await request.json();

    if (!Array.isArray(tasks)) {
      return NextResponse.json(
        { error: "Tasks must be an array" },
        { status: 400 }
      );
    }

    // Update all tasks in a transaction
    await prisma.$transaction(
      tasks.map((task: { id: string; columnId: string; order: number }) =>
        prisma.task.update({
          where: { id: task.id },
          data: {
            columnId: task.columnId,
            order: task.order,
          },
        })
      )
    );

    return NextResponse.json({ message: "Tasks updated successfully" });
  } catch (error) {
    console.error("Error updating tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
