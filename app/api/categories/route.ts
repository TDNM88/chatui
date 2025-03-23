import type { NextRequest } from "next/server"
import { getCategories, getCategoryById, createCategory, updateCategory, deleteCategory } from "@/lib/categories"
import { NextResponse } from "next/server"

export async function GET(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (id) {
      const category = await getCategoryById(id)

      if (!category) {
        return Response.json({ error: "Category not found" }, { status: 404 })
      }

      return Response.json({ category })
    } else {
      const categories = await getCategories()
      return Response.json({ categories })
    }
  } catch (error) {
    console.error("Error fetching categories:", error)
    return Response.json({ error: "Failed to fetch categories" }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { name, description } = await req.json()

    if (!name) {
      return Response.json({ error: "Name is required" }, { status: 400 })
    }

    const id = await createCategory({ name, description })

    return Response.json({ id, success: true })
  } catch (error) {
    console.error("Error creating category:", error)
    return Response.json({ error: "Failed to create category" }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { id, ...data } = await req.json()
    const success = await updateCategory(id, data)
    return NextResponse.json({ success })
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = req.nextUrl.searchParams.get("id")

    if (!id) {
      return Response.json({ error: "Category ID is required" }, { status: 400 })
    }

    const success = await deleteCategory(id)

    if (!success) {
      return Response.json({ error: "Category not found" }, { status: 404 })
    }

    return Response.json({ success: true })
  } catch (error) {
    console.error("Error deleting category:", error)
    return Response.json({ error: "Failed to delete category" }, { status: 500 })
  }
}

